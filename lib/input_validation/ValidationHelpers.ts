/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IDidResolveResult } from '@decentralized-identity/did-common-typescript';
import { IPayloadProtectionSigning, JoseBuilder } from 'verifiablecredentials-crypto-sdk-typescript';
import { IValidationOptions } from '../options/IValidationOptions';
import IValidatorOptions from '../options/IValidatorOptions';
import ValidationOptions from '../options/ValidationOptions';
import ClaimToken, { TokenType } from '../verifiable_credential/ClaimToken';
import VerifiableCredentialConstants from '../verifiable_credential/VerifiableCredentialConstants';
import { IdTokenValidationResponse } from './IdTokenValidationResponse';
import { IValidationResponse } from './IValidationResponse';
import { IExpectedVerifiablePresentation, IExpectedVerifiableCredential, IExpectedSiop, IExpectedAudience } from '../options/IExpected';
import LinkedDataCryptoSuitePublicKey from './LinkedDataCryptoSuitePublicKey';
import ErrorHelpers from '../error_handling/ErrorHelpers';
import ValidationError from '../error_handling/ValidationError';
import { AuthenticationErrorCode } from '../error_handling/AuthenticationErrorCode';
const errorCode = (error: number) => ErrorHelpers.errorCode('VCSDKVaHe', error);

require('es6-promise').polyfill();
require('isomorphic-fetch');

/**
 * Helper Class for validation
 */
export class ValidationHelpers {

  /**
 * Create new instance of <see @class ValidationHelpers>
 * @param validatorOptions The validator options
 * @param validationOptions Issuance validationOptions containing delegates
 * @param tokenType Describe the type of token for error messages
 */
  constructor(private validatorOptions: IValidatorOptions, private validationOptions: IValidationOptions, private tokenType: TokenType) {
  }

  /**
   * Get the token object from the token
   * @param validationResponse The response for the requestor
   * @param token The token to parse
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   * @returns validationResponse.didSignature The deserialized token
   * @returns validationResponse.didKid The kid used to sign the token
   * @returns validationResponse.did The DID used to sign the token
   * @returns validationResponse.payloadObject The parsed payload
   * @returns validationResponse.issuer The issuer of the token
   */
  public async getTokenObject(validationResponse: IValidationResponse, token: string | object): Promise<IValidationResponse> {
    const self: any = this;
    validationResponse.didSignature = undefined;
    // check for json ld proofs
    if (typeof token === 'object') {
      try {
        // instantiate IPayloadProtectionSigning
        validationResponse.didSignature = await (self as ValidationOptions).validatorOptions.crypto.signingProtocol(JoseBuilder.JSONLDProofs).deserialize(JSON.stringify(token));
        validationResponse.payloadProtectionProtocol = JoseBuilder.JSONLDProofs;
      } catch (exception) {
        console.error('Failing to decode json ld proof');
      }
    }

    if (!validationResponse.didSignature) {
      // check for compact JWT tokens
      try {
        // instantiate IPayloadProtectionSigning
        validationResponse.didSignature = await (self as ValidationOptions).validatorOptions.crypto.signingProtocol(JoseBuilder.JWT).deserialize(<string>token);
        validationResponse.payloadProtectionProtocol = JoseBuilder.JWT;
      } catch (exception) {
        return {
          result: false,
          code: errorCode(1),
          detailedError: `The ${(self as ValidationOptions).tokenType} could not be deserialized`,
          innerError: exception,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidRequest,
        };
      }
    }

    if (!validationResponse.didSignature) {
      return {
        result: false,
        code: errorCode(2),
        detailedError: `The signature in the ${(self as ValidationOptions).tokenType} has an invalid format`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidRequest,
      };
    }

    if (validationResponse.payloadProtectionProtocol === JoseBuilder.JWT) {
      const payload = validationResponse.didSignature!.signaturePayload;
      if (!payload) {
        return {
          result: false,
          code: errorCode(3),
          detailedError: `The payload in the ${(self as ValidationOptions).tokenType} is undefined`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidRequest,
        };
      }

      try {
        validationResponse.payloadObject = JSON.parse(payload.toString());
      } catch (err) {
        console.error(err);
        return {
          result: false,
          code: errorCode(4),
          innerError: err,
          detailedError: `The payload in the ${(self as ValidationOptions).tokenType} is no valid JSON`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidRequest,
        };
      }

      validationResponse.didKid = validationResponse.didSignature.signatureProtectedHeader?.kid;
      if (!validationResponse.didKid) {
        return {
          result: false,
          code: errorCode(5),
          detailedError: `The protected header in the ${(self as ValidationOptions).tokenType} does not contain the kid`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidRequest,
        };
      }

      validationResponse.issuer = validationResponse.payloadObject.iss;
      validationResponse.expiration = validationResponse.payloadObject.exp;
    } else {
      validationResponse.payloadObject = token;
      validationResponse.issuer = validationResponse.payloadObject.issuer;
      const expiration: string = validationResponse.payloadObject.expirationDate;
      if (expiration && typeof expiration === 'string') {
        const exp = Date.parse(expiration);
        validationResponse.expiration = exp;
      }

      const proof = validationResponse.payloadObject.proof;
      if (!proof) {
        return {
          result: false,
          code: errorCode(6),
          detailedError: `The proof is not available in the json ld payload`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidRequest,
        };
      }
      if (!proof.verificationMethod) {
        return {
          result: false,
          code: errorCode(7),
          detailedError: `The proof does not contain the verificationMethod in the json ld payload`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidRequest,
        };
      }
      validationResponse.didKid = proof.verificationMethod;
    }

    return validationResponse;
  }

  /**
   * Resolve the DID and retrieve the public keys
   * @param validatorOptions The validator options
   * @param validationOptions Issuance validationOptions containing delegates
   * @param validationResponse The response for the requestor
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   * @returns validationResponse.didDocument The DID document
   * @returns validationResponse.didSigningPublicKey The public key to validate the token signature
   */
  public async resolveDidAndGetKeys(validationResponse: IValidationResponse): Promise<IValidationResponse> {
    const self: any = this;
    try {
      const resolveResult: IDidResolveResult = await (self as ValidationOptions).validatorOptions.resolver.resolve(validationResponse.did as string);

      if (!resolveResult || !resolveResult.didDocument) {
        return validationResponse = {
          result: false,
          code: errorCode(8),
          detailedError: `Could not retrieve DID document '${validationResponse.did}'`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
        }
      }
      validationResponse.didDocument = resolveResult.didDocument;

    } catch (err) {
      console.error(err);
      return {
        result: false,
        code: errorCode(9),
        innerError: err,
        detailedError: `Could not resolve DID '${validationResponse.did}'`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    // Get public keys
    if (!validationResponse.didKid) {
      return {
        result: false,
        code: errorCode(10),
        detailedError: `The kid is not referenced in the request`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidRequest,
      };
    }

    let signingKey: any
    try {
      signingKey = ValidationHelpers.getPublicKeyFromDidDocument(validationResponse.didDocument, validationResponse.didKid, validationResponse.did!);
    } catch (exception) {
      return {
        result: false,
        code: errorCode(11),
        detailedError: exception.message,
        innerError: exception,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    validationResponse.didSigningPublicKey = signingKey;
    return validationResponse;
  }

  /**
   * Retireve public key from did document
   * @param validationResponse The response for the requestor
   */
  public static getPublicKeyFromDidDocument(didDocument: any, kid: string, did: string): any {
    const publicKey = didDocument.getPublicKey(kid);
    let signingKey: any;
    if (publicKey) {
      // Old ion protocol, to be deleted after switch
      signingKey = LinkedDataCryptoSuitePublicKey.getPublicKey(publicKey);
    } else {
      if (didDocument.rawDocument?.verificationMethod) {
        const keyIdParts = kid.split('#');
        const keyId = keyIdParts[keyIdParts.length - 1];
        const verification = didDocument.rawDocument?.verificationMethod.filter((vm: any) => vm.id.includes(`#${keyId}`));
        if (verification) {
          signingKey = LinkedDataCryptoSuitePublicKey.getPublicKey(verification[0]);
        }
      }
    }

    //  use jwk in request if did is not registered
    if (!signingKey) {
      throw new ValidationError(`The did '${did}' does not have a public key with kid '${kid}'. Public key : '${publicKey ? JSON.stringify(publicKey) : 'undefined'}'`, errorCode(39));
    }

    return signingKey;
  }

  /**
   * Check the time validity of the token
   * @param validationResponse The response for the requestor
   * @param clockSkewToleranceSeconds Drift used to extend time checks in seconds. Covers for clock drifts
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   */
  public checkTimeValidityOnToken(validationResponse: IValidationResponse, clockSkewToleranceSeconds: number = 300): IValidationResponse {
    const self: any = this;
    const current = Math.trunc(Date.now() / 1000);

    // a falsy check is insufficient, zero is a valid epoch time
    if (validationResponse.expiration !== undefined) {
      // initialize in utc time
      const exp = (validationResponse.expiration + clockSkewToleranceSeconds);

      /**
       * The processing of the "exp" claim requires that the current date/time MUST be before the expiration date/time listed in the "exp" claim
       */
      if (current >= exp) {
        return {
          result: false,
          code: errorCode(12),
          detailedError: `The presented ${(self as ValidationOptions).tokenType} is expired ${exp}, now ${current as number}`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
        };
      }
    }
    if (validationResponse.payloadObject.nbf) {
      // initialize in utc time
      const nbf = (validationResponse.payloadObject.nbf - clockSkewToleranceSeconds);

      /**
       * JWT spec says: The processing of the "nbf" claim requires that the current date/time MUST be after or equal to the not-before date/time listed in the "nbf" claim
       */
      if (current < nbf) {
        return {
          result: false,
          code: errorCode(40),
          detailedError: `The presented ${(self as ValidationOptions).tokenType} is not yet valid ${nbf}`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
        };
      }
    }

    return validationResponse;
  }

  /**
    * Check the scope validity of the token such as iss and aud
    * @param validationResponse The response for the requestor
    * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
    */
  public checkScopeValidityOnIdToken(validationResponse: IValidationResponse, expected: IExpectedAudience): IValidationResponse {
    const self: any = this;

    // check iss value
    const issuer = (validationResponse as IdTokenValidationResponse).expectedIssuer;
    if (!issuer) {
      return {
        result: false,
        code: errorCode(13),
        detailedError: `The issuer in configuration was not found`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    if (!validationResponse.issuer) {
      return {
        result: false,
        code: errorCode(14),
        detailedError: `Missing iss property in idToken. Expected '${JSON.stringify(issuer)}'`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    if (issuer !== validationResponse.issuer) {
      return {
        result: false,
        code: errorCode(15),
        detailedError: `The issuer in configuration '${issuer}' does not correspond with the issuer in the payload ${validationResponse.issuer}`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    // check for the audience to match
    if (expected.audience && expected.audience !== validationResponse.payloadObject.aud) {
      return {
        result: false,
        code: errorCode(16),
        detailedError: `The audience ${validationResponse.payloadObject.aud} is invalid`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    return validationResponse;
  }

  /**
    * Check the scope validity of the verifiable presentation token such as iss and aud
    * @param validationResponse The response for the requestor
    * @param expected Expected output of the verifiable credential
    * @param siopDid The DID which has been extablished during the SIOP validation
    * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
    */
  public checkScopeValidityOnVpToken(validationResponse: IValidationResponse, expected: IExpectedVerifiablePresentation, siopDid: string): IValidationResponse {
    const self: any = this;

    // check iss value
    if (!validationResponse.issuer) {
      return {
        result: false,
        code: errorCode(17),
        detailedError: `Missing iss property in verifiablePresentation. Expected '${siopDid}'`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    if (siopDid && validationResponse.issuer !== siopDid) {
      return <IValidationResponse>{
        result: false,
        code: errorCode(18),
        detailedError: `Wrong iss property in verifiablePresentation. Expected '${siopDid}'`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    // check aud value
    if (expected.didAudience) {
      if (!validationResponse.payloadObject.aud) {
        return {
          result: false,
          code: errorCode(19),
          detailedError: `Missing aud property in verifiablePresentation. Expected '${expected.didAudience}'`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
        };
      }

      if (validationResponse.payloadObject.aud !== expected.didAudience) {
        return {
          result: false,
          code: errorCode(20),
          detailedError: `Wrong aud property in verifiablePresentation. Expected '${expected.didAudience}'. Found '${validationResponse.payloadObject.aud}'`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
        };
      }
    }

    return validationResponse;
  }

  /**
    * Check the scope validity of the verifiable credential token such as iss and aud
    * @param validationResponse The response for the requestor
    * @param expected Expected output of the verifiable credential
    * @param siopDid The DID which has been extablished during the SIOP validation
    * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
    */
  public checkScopeValidityOnVcToken(validationResponse: IValidationResponse, _expected: IExpectedVerifiableCredential, siopDid: string): IValidationResponse {
    const self: any = this;

    // check sub value
    if (!validationResponse.payloadObject.sub) {
      return {
        result: false,
        code: errorCode(21),
        detailedError: `Missing sub property in verifiableCredential. Expected '${siopDid}'`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    // check sub value
    if (siopDid && validationResponse.payloadObject.sub !== siopDid) {
      return {
        result: false,
        code: errorCode(22),
        detailedError: `Wrong sub property in verifiableCredential. Expected '${siopDid}'`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    return validationResponse;
  }

  /**
    * Check the scope validity of the token such as iss and aud
    * @param validationResponse The response for the requestor
    * @param expected Expected output of the verifiable credential
    * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
    */
  public checkScopeValidityOnSiopToken(validationResponse: IValidationResponse, expected: IExpectedSiop): IValidationResponse {
    const self: any = this;

    // check iss value
    if (!validationResponse.issuer) {
      return validationResponse = {
        result: false,
        code: errorCode(23),
        detailedError: `Missing iss property in siop. Expected '${VerifiableCredentialConstants.TOKEN_SI_ISS}'`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidRequest,
      };
    }

    if (validationResponse.issuer !== VerifiableCredentialConstants.TOKEN_SI_ISS) {
      return validationResponse = {
        result: false,
        code: errorCode(24),
        detailedError: `Wrong iss property in siop. Expected '${VerifiableCredentialConstants.TOKEN_SI_ISS}'`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    // check aud value
    if (!validationResponse.payloadObject.aud) {
      return validationResponse = {
        result: false,
        code: errorCode(25),
        detailedError: `Missing aud property in siop`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidRequest,
      };
    }

    if (expected.audience) {
      if (validationResponse.payloadObject.aud !== expected.audience) {
        return validationResponse = {
          result: false,
          code: errorCode(26),
          detailedError: `Wrong aud property in siop. Expected '${expected.audience}'`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
        };
      }
    }

    return validationResponse;
  }

  /**
   * Validate the DID signature on the token
   * @param validationResponse The response for the requestor
   * @param token Token to validate
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   */
  public async validateDidSignature(validationResponse: IValidationResponse, token: IPayloadProtectionSigning): Promise<IValidationResponse> {
    const self: any = this;
    try {
      // show header
      const validation = await token.verify([validationResponse.didSigningPublicKey]);
      if (!validation) {
        return validationResponse = {
          result: false,
          code: errorCode(27),
          detailedError: `The signature on the payload in the ${(self as ValidationOptions).tokenType} is invalid`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
        };
      }
    } catch (err) {
      console.error(err);
      return validationResponse = {
        result: false,
        code: errorCode(28),
        detailedError: `Failed to validate signature`,
        innerError: err,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    return validationResponse;
  }

  /**
   * fetch the public keys for an open id token
   * @param validationResponse The response for the requestor
   * @param token ClaimToken instance
   */
  public async fetchOpenIdTokenPublicKeys(validationResponse: IValidationResponse, token: ClaimToken): Promise<IValidationResponse | any> {

    // Get the keys to validate the token
    let keys: any;

    try {
      if (token.type === TokenType.idToken) {
        let response = await this.validatorOptions.fetchRequest.fetch(token.id, 'OIDCConfiguration', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          return {
            result: false,
            code: errorCode(29),
            detailedError: `Could not fetch token configuration needed to validate token`,
            status: this.validatorOptions.invalidTokenError,
            wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
          };
        }

        const config = await response.json();
        const keysUrl = config[VerifiableCredentialConstants.CONFIG_JWKS];

        if (!keysUrl) {
          return {
            result: false,
            code: errorCode(30),
            detailedError: `No reference to jwks found in token configuration`,
            status: this.validatorOptions.invalidTokenError,
            wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
          };
        }

        response = await this.validatorOptions.fetchRequest.fetch(keysUrl, 'OIDCJwks', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          return {
            result: false,
            code: errorCode(31),
            detailedError: `Could not fetch keys needed to validate token on '${keysUrl}'`,
            status: this.validatorOptions.invalidTokenError,
            wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
          };
        }

        keys = await response.json();

        if (!keys || !keys.keys) {
          return {
            result: false,
            code: errorCode(32),
            detailedError: `No or bad jwks keys found in token configuration`,
            status: this.validatorOptions.invalidTokenError,
            wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
          };
        }

        // Get issuer
        (validationResponse as IdTokenValidationResponse).expectedIssuer = config.issuer;
        if (!config.issuer) {
          return {
            result: false,
            code: errorCode(33),
            detailedError: `No issuer found in token configuration`,
            status: this.validatorOptions.invalidTokenError,
            wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
          };
        }
      }
    } catch (err) {
      console.error(err);
      return {
        result: false,
        innerError: err,
        code: errorCode(34),
        detailedError: `Could not fetch token configuration`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }

    return keys;
  }

  /**
   * Validate the signature on a token. Fetch validation key
   * @param validationResponse The response for the requestor
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   * @returns validationResponse.issuer The issuer found in the configuration. Should match the issuer in the token.
   */
  public async fetchKeyAndValidateSignatureOnIdToken(validationResponse: IValidationResponse, token: ClaimToken): Promise<IValidationResponse> {
    const self: any = this;
    const publicKeyResponse = await (self as IValidationOptions).fetchOpenIdTokenPublicKeysDelegate(validationResponse, token);

    // if we don't have a keys property, it's because we have IValidationResponse instance, no good way to check for type of an interface
    if (!publicKeyResponse.keys) {
      return <IValidationResponse>publicKeyResponse;
    }

    const keys = publicKeyResponse.keys;

    // check signature
    let validated = false;
    try {
      if (token.type === TokenType.idToken) {
        const header = token.tokenHeader;
        const kid = header[VerifiableCredentialConstants.TOKEN_KID];
        let checkAllKeys = true;
        if (kid) {
          let key = keys.filter((k: any) => k.kid === kid);
          if (key[0]) {
            validationResponse = await (self as IValidationOptions).validateSignatureOnTokenDelegate(validationResponse, token, key[0]);
            if (!validationResponse.result) {
              return validationResponse;
            } else {
              validated = true;
              checkAllKeys = false;
            }
          }
        }
        // Try all keys in jwk
        if (checkAllKeys) {
          for (let keyCounter = 0; keyCounter < keys.length; keyCounter++) {
            validationResponse = await (self as IValidationOptions).validateSignatureOnTokenDelegate(validationResponse, token, keys[keyCounter]);
            if (validationResponse.result) {
              validated = true;
              break;
            }
          }
        }
        if (!validated) {
          return {
            result: false,
            code: errorCode(35),
            detailedError: `Could not validate token signature`,
            status: this.validatorOptions.invalidTokenError,
            wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
          };
        }
      }

      validationResponse.result = true;
      validationResponse.detailedError = '';

      validationResponse.validationResult = { idTokens: <any>token };
      return validationResponse;
    } catch (err) {
      console.error(err);
      return {
        result: false,
        code: errorCode(36),
        innerError: err,
        detailedError: `Could not validate signature on id token`,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }
  }

  /**
   * Validation a signed token 
   * @param validationResponse The response for the requestor
   * @param token Token to validate
   * @param key used to validate token
   */
  public async validateSignatureOnToken(validationResponse: IValidationResponse, token: ClaimToken, key: any): Promise<IValidationResponse> {

    const self: any = this;
    try {
      // Get token and check signature
      validationResponse = await (self as IValidationOptions).getTokenObjectDelegate(validationResponse, <string>token.rawToken);
      const validation = await (self as ValidationOptions).validatorOptions.crypto.signingProtocol(validationResponse.payloadProtectionProtocol!).verify([key]);
      if (!validation) {
        return {
          result: false,
          code: errorCode(37),
          detailedError: `The presented ${(self as ValidationOptions).tokenType} is has an invalid signature`,
          status: this.validatorOptions.invalidTokenError,
          wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
        };
      }

      validationResponse.result = true;
      validationResponse.detailedError = '';
      return validationResponse;
    } catch (err) {
      console.error(err);
      return {
        result: false,
        code: errorCode(38),
        detailedError: `Failed to verify token signature`,
        innerError: err,
        status: this.validatorOptions.invalidTokenError,
        wwwAuthenticateError: AuthenticationErrorCode.invalidToken,
      };
    }
  }
}
