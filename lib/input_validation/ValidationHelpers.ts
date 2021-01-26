/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { DidDocument, IDidResolveResult } from '@decentralized-identity/did-common-typescript';
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
const jp = require('jsonpath');

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
          detailedError: `The ${(self as ValidationOptions).tokenType} could not be deserialized`,
          status: 400
        };
      }
    }

    if (!validationResponse.didSignature) {
      return {
        result: false,
        detailedError: `The signature in the ${(self as ValidationOptions).tokenType} has an invalid format`,
        status: 403
      };
    }

    if (validationResponse.payloadProtectionProtocol === JoseBuilder.JWT) {
      const payload = validationResponse.didSignature!.signaturePayload;
      if (!payload) {
        return {
          result: false,
          detailedError: `The payload in the ${(self as ValidationOptions).tokenType} is undefined`,
          status: 403
        };
      }

      try {
        validationResponse.payloadObject = JSON.parse(payload.toString());
      } catch (err) {
        console.error(err);
        return {
          result: false,
          detailedError: `The payload in the ${(self as ValidationOptions).tokenType} is no valid JSON`,
          status: 400
        };
      }

      validationResponse.didKid = validationResponse.didSignature.signatureProtectedHeader?.kid;
      if (!validationResponse.didKid) {
        return {
          result: false,
          detailedError: `The protected header in the ${(self as ValidationOptions).tokenType} does not contain the kid`,
          status: 403
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
          detailedError: `The proof is not available in the json ld payload`,
          status: 403
        };
      }
      if (!proof.verificationMethod) {
        return {
          result: false,
          detailedError: `The proof does not contain the verificationMethod in the json ld payload`,
          status: 403
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
          detailedError: `Could not retrieve DID document '${validationResponse.did}'`,
          status: 403
        }
      }
      validationResponse.didDocument = resolveResult.didDocument;

    } catch (err) {
      console.error(err);
      return {
        result: false,
        detailedError: `Could not resolve DID '${validationResponse.did}'`,
        status: 403
      };
    }

    // Get public keys
    if (!validationResponse.didKid) {
      return {
        result: false,
        detailedError: `The kid is not referenced in the request`,
        status: 403
      };
    }

    let signingKey: any
    try {
      signingKey = ValidationHelpers.getPublicKeyFromDidDocument(validationResponse.didDocument, validationResponse.didKid, validationResponse.did!);
    } catch (exception) {
      return {
        result: false,
        detailedError: exception.message,
        status: 403
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
        const verification = didDocument.rawDocument?.verificationMethod.filter ((vm: any) => vm.id.includes(`#${keyId}`));
        if (verification) {
          signingKey = LinkedDataCryptoSuitePublicKey.getPublicKey(verification[0]);
        }
      }
    }

    //  use jwk in request if did is not registered
    if (!signingKey) {
      throw new Error(`The did '${did}' does not have a public key with kid '${kid}'. Public key : '${publicKey ? JSON.stringify(publicKey) : 'undefined'}'`);
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

    if (validationResponse.expiration) {
      // initialize in utc time
      const exp = (validationResponse.expiration + clockSkewToleranceSeconds);

      /**
       * The processing of the "exp" claim requires that the current date/time MUST be before the expiration date/time listed in the "exp" claim
       */
      if (current >= exp) {
        return {
          result: false,
          detailedError: `The presented ${(self as ValidationOptions).tokenType} is expired ${exp}, now ${current as number}`,
          status: 403
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
          detailedError: `The presented ${(self as ValidationOptions).tokenType} is not yet valid ${nbf}`,
          status: 403
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
        detailedError: `The issuer in configuration was not found`,
        status: 403
      };
    }

    if (!validationResponse.issuer) {
      return {
        result: false,
        detailedError: `Missing iss property in idToken. Expected '${JSON.stringify(issuer)}'`,
        status: 403
      };
    }

    if (issuer !== validationResponse.issuer) {
      return {
        result: false,
        detailedError: `The issuer in configuration '${issuer}' does not correspond with the issuer in the payload ${validationResponse.issuer}`,
        status: 403
      };
    }

    // check for the audience to match
    if (expected.audience && expected.audience !== validationResponse.payloadObject.aud) {
      return {
        result: false,
        status: 401,
        detailedError: `The audience ${validationResponse.payloadObject.aud} is invalid`
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
        detailedError: `Missing iss property in verifiablePresentation. Expected '${siopDid}'`,
        status: 403
      };
    }

    if (siopDid && validationResponse.issuer !== siopDid) {
      return <IValidationResponse>{
        result: false,
        detailedError: `Wrong iss property in verifiablePresentation. Expected '${siopDid}'`,
        status: 403
      };
    }

    // check aud value
    if (expected.didAudience) {
      if (!validationResponse.payloadObject.aud) {
        return {
          result: false,
          detailedError: `Missing aud property in verifiablePresentation. Expected '${expected.didAudience}'`,
          status: 403
        };
      }

      if (validationResponse.payloadObject.aud !== expected.didAudience) {
        return {
          result: false,
          detailedError: `Wrong aud property in verifiablePresentation. Expected '${expected.didAudience}'. Found '${validationResponse.payloadObject.aud}'`,
          status: 403
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
        detailedError: `Missing sub property in verifiableCredential. Expected '${siopDid}'`,
        status: 403
      };
    }

    // check sub value
    if (siopDid && validationResponse.payloadObject.sub !== siopDid) {
      return {
        result: false,
        detailedError: `Wrong sub property in verifiableCredential. Expected '${siopDid}'`,
        status: 403
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

    // check sub
    /* TODO temporary disabled
    if (validationResponse.payloadObject.sub && validationResponse.payloadObject.sub !== validationResponse.did) {
      return {
        result: false,
        detailedError: `The sub property in the siopIssuance must be equal to ${validationResponse.did}`,
        status: 403
      };
    }
    */

    // check iss value
    if (!validationResponse.issuer) {
      return validationResponse = {
        result: false,
        detailedError: `Missing iss property in siop. Expected '${VerifiableCredentialConstants.TOKEN_SI_ISS}'`,
        status: 403
      };
    }

    if (validationResponse.issuer !== VerifiableCredentialConstants.TOKEN_SI_ISS) {
      return validationResponse = {
        result: false,
        detailedError: `Wrong iss property in siop. Expected '${VerifiableCredentialConstants.TOKEN_SI_ISS}'`,
        status: 403
      };
    }

    // check aud value
    if (!validationResponse.payloadObject.aud) {
      return validationResponse = {
        result: false,
        detailedError: `Missing aud property in siop`,
        status: 403
      };
    }

    if (expected.audience) {
      if (validationResponse.payloadObject.aud !== expected.audience) {
        return validationResponse = {
          result: false,
          detailedError: `Wrong aud property in siop. Expected '${expected.audience}'`,
          status: 403
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
          detailedError: `The signature on the payload in the ${(self as ValidationOptions).tokenType} is invalid`,
          status: 403
        };
      }
    } catch (err) {
      console.error(err);
      return validationResponse = {
        result: false,
        detailedError: `Failed to validate signature`,
        status: 403
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
        let response = await fetch(token.id);
        
        if (!response.ok) {
          return {
            result: false,
            status: 403,
            detailedError: `Could not fetch token configuration needed to validate token`
          };
        }
        
        const config = await response.json();
        const keysUrl = config[VerifiableCredentialConstants.CONFIG_JWKS];
        
        if (!keysUrl) {
          return {
            result: false,
            status: 403,
            detailedError: `No reference to jwks found in token configuration`
          };
        }
        
        response = await fetch(keysUrl);
        
        if (!response.ok) {
          return {
            result: false,
            status: 403,
            detailedError: `Could not fetch keys needed to validate token on '${keysUrl}'`
          };
        }

        keys = await response.json();
        
        if (!keys || !keys.keys) {
          return {
            result: false,
            status: 403,
            detailedError: `No or bad jwks keys found in token configuration`
          };
        }

        // Get issuer
        (validationResponse as IdTokenValidationResponse).expectedIssuer = config.issuer;
        if (!config.issuer) {
          return {
            result: false,
            status: 403,
            detailedError: `No issuer found in token configuration`
          };
        }
      }
    } catch (err) {
      console.error(err);
      return {
        result: false,
        status: 403,
        detailedError: `Could not fetch token configuration`
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
    const self: any = this ;
    const publicKeyResponse = await (self as IValidationOptions).fetchOpenIdTokenPublicKeysDelegate(validationResponse, token);

    // if we don't have a keys property, it's because we have IValidationResponse instance, no good way to check for type of an interface
    if(!publicKeyResponse.keys) {
      return <IValidationResponse> publicKeyResponse;
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
            status: 403,
            detailedError: `Could not validate token signature`
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
        status: 403,
        detailedError: `Could not validate signature on id token`
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
          detailedError: `The presented ${(self as ValidationOptions).tokenType} is has an invalid signature`,
          status: 403
        };
      }

      validationResponse.result = true;
      validationResponse.detailedError = '';
      return validationResponse;
    } catch (err) {
      console.error(err);
      return {
        result: false,
        detailedError: `Failed to verify token signature`,
        status: 403
      };
    }
  }
}
