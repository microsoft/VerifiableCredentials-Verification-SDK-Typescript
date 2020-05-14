/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IDidResolveResult } from '@decentralized-identity/did-common-typescript';
import { ICryptoToken, JoseConstants, ProtectionFormat } from '@microsoft/crypto-sdk';
import base64url from "base64url";
import { IValidationOptions } from '../Options/IValidationOptions';
import IValidatorOptions from '../Options/IValidatorOptions';
import ValidationOptions from '../Options/ValidationOptions';
import ClaimToken, { TokenType } from '../VerifiableCredential/ClaimToken';
import VerifiableCredentialConstants from '../VerifiableCredential/VerifiableCredentialConstants';
import { IdTokenValidationResponse } from './IdTokenValidationResponse';
import { IValidationResponse } from './IValidationResponse';
import { IExpectedIdToken, IExpectedVerifiablePresentation, IExpectedVerifiableCredential, IdTokenValidation } from '..';
import { IExpectedBase, IExpectedSiop } from '../Options/IExpected';

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
   * Get the token object from the self issued token
   * @param validationResponse The response for the requestor
   * @param token The token to parse
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   * @returns validationResponse.payloadObject The parsed payload
   */
  public getSelfIssuedTokenObject(validationResponse: IValidationResponse, token: string): IValidationResponse {
    // Deserialize the token
    try {
      const split = token.split('.');
      validationResponse.payloadObject = JSON.parse(base64url.decode(split[1]));
    } catch (err) {
      console.error(err);
      return {
        result: false,
        detailedError: `The self issued token could not be deserialized`,
        status: 400
      };
    }

    return validationResponse;
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
   */
  public getTokenObject(validationResponse: IValidationResponse, token: string): IValidationResponse {
    let tokenPayload: Buffer;
    const self: any = this;
    try {
      validationResponse.didSignature = (self as ValidationOptions).validatorOptions.crypto.payloadProtectionProtocol.deserialize(
        token,
        ProtectionFormat.JwsCompactJson,
        (self as ValidationOptions).validatorOptions.crypto.payloadProtectionOptions);
      tokenPayload = validationResponse.didSignature!.get(JoseConstants.tokenPayload);
      if (!validationResponse.didSignature || !tokenPayload) {
        return {
          result: false,
          detailedError: `The signature in the ${(self as ValidationOptions).tokenType} has an invalid format`,
          status: 403
        };
      }

      const signature = validationResponse.didSignature.get(JoseConstants.tokenSignatures)[0];
      const header = signature.protected;
      const kid = header.get(JoseConstants.Kid);
      validationResponse.didKid = kid;
      if (!validationResponse.didKid) {
        return {
          result: false,
          detailedError: `The protected header in the ${(self as ValidationOptions).tokenType} does not contain the kid`,
          status: 403
        };
      }
    } catch (err) {
      console.error(err);
      return {
        result: false,
        detailedError: `The ${(self as ValidationOptions).tokenType} could not be deserialized`,
        status: 400
      };
    }
    try {
      validationResponse.payloadObject = JSON.parse(tokenPayload!.toString());
    } catch (err) {
      console.error(err);
      return {
        result: false,
        detailedError: `The payload in the ${(self as ValidationOptions).tokenType} is no valid JSON`,
        status: 400
      };
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

    let signingKey: any;
    const publicKey = validationResponse.didDocument.getPublicKey(validationResponse.didKid);
    if (publicKey) {
      signingKey = publicKey.publicKeyJwk;
    }

    // TODO use jwk in request if did is not registered
    if (!signingKey) {
      return {
        result: false,
        detailedError: `The did '${validationResponse.did}' does not have a public key with kid '${validationResponse.didKid}'`,
        status: 403
      };
    }
    validationResponse.didSigningPublicKey = signingKey;
    return validationResponse;
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

    if (validationResponse.payloadObject.exp) {
      // initialize in utc time
      const exp = (validationResponse.payloadObject.exp + clockSkewToleranceSeconds);

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
    * @param expected Expected output of the verifiable credential
   * @param contractId Conract type asked during siop
    * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
    */
  public checkScopeValidityOnIdToken(validationResponse: IValidationResponse, expected: IExpectedIdToken, contractId: string): IValidationResponse {
    const self: any = this;

    // check iss value
    const issuer = (validationResponse as IdTokenValidationResponse).issuer;
    if (!issuer) {
      return {
        result: false,
        detailedError: `The issuer in configuration was not found`,
        status: 403
      };
    }

    // Get issuers from configuration
    const issuers = IdTokenValidation.getIssuersFromExpected(expected, contractId);
    if (!(issuers instanceof Array)) {
      return <IdTokenValidationResponse>issuers;
    }


    if (!validationResponse.payloadObject.iss) {
      return {
        result: false,
        detailedError: `Missing iss property in idToken. Expected '${JSON.stringify(issuers)}'`,
        status: 403
      };
    }

    if (issuer !== validationResponse.payloadObject.iss) {
      return {
        result: false,
        detailedError: `The issuer in configuration '${issuer}' does not correspond with the issuer in the payload ${validationResponse.payloadObject.iss}`,
        status: 403
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
    if (!validationResponse.payloadObject.iss) {
      return {
        result: false,
        detailedError: `Missing iss property in verifiablePresentation. Expected '${siopDid}'`,
        status: 403
      };
    }

    if (siopDid && validationResponse.payloadObject.iss !== siopDid) {
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
          detailedError: `Wrong aud property in verifiablePresentation. Expected '${expected.didAudience}'`,
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
        detailedError: `The sub property in the siop must be equal to ${validationResponse.did}`,
        status: 403
      };
    }
    */

    // check iss value
    if (!validationResponse.payloadObject.iss) {
      return validationResponse = {
        result: false,
        detailedError: `Missing iss property in siop. Expected '${VerifiableCredentialConstants.TOKEN_SI_ISS}'`,
        status: 403
      };
    }

    if (validationResponse.payloadObject.iss !== VerifiableCredentialConstants.TOKEN_SI_ISS) {
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
  public async validateDidSignature(validationResponse: IValidationResponse, token: ICryptoToken): Promise<IValidationResponse> {
    const self: any = this;
    try {
      // show header
      const signature = validationResponse.didSignature!.get(JoseConstants.tokenSignatures)[0];
      const kid = signature.protected.get(VerifiableCredentialConstants.TOKEN_KID);
      console.log(`Validate DID signature with kid '${kid}', key kid '${validationResponse.didSigningPublicKey?.kid}'`);
      const validation = await (self as ValidationOptions).validatorOptions.crypto.payloadProtectionProtocol.verify(
        [validationResponse.didSigningPublicKey],
        validationResponse.didSignature!.get(JoseConstants.tokenPayload) as Buffer,
        token,
        (self as ValidationOptions).validatorOptions.crypto.payloadProtectionOptions);
      if (!validation.result) {
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
   * Validate the signature on a token. Fetch validation key
   * @param validationResponse The response for the requestor
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   * @returns validationResponse.issuer The issuer found in the configuration. Should match the issuer in the token.
   */
  public async fetchKeyAndValidateSignatureOnIdToken(validationResponse: IValidationResponse, token: ClaimToken): Promise<IValidationResponse> {
    const self: any = this;

    // Get the keys to validate the token
    let keys: any;
    try {
      if (token.type === TokenType.idToken) {
        console.log(`Id token configuration token '${token.configuration}'`);
        let response = await fetch(token.configuration);
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
        console.log(`Fetch metadata from '${keysUrl}'`);
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
        keys = keys.keys;

        // Get issuer
        (validationResponse as IdTokenValidationResponse).issuer = config.issuer;
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

    // check signature
    let validated = false;
    try {
      if (token.type === TokenType.idToken) {
        const self: any = this;
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
   * Decode the tokens from the SIOP request
   * @param validationResponse The response for the requestor
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   * @returns validationResponse.tokensToValidate List of tokens found in the SIOP
   */
  public getTokensFromSiop(validationResponse: IValidationResponse): IValidationResponse {
    const self: any = this;
    const attestations = validationResponse.payloadObject[VerifiableCredentialConstants.ATTESTATIONS];
    if (attestations) {
      // Decode tokens
      try {
        validationResponse.tokensToValidate = ClaimToken.getClaimTokensFromAttestations(attestations);
      } catch (err) {
        console.error(err);
        return {
          result: false,
          status: 403,
          detailedError: `Failed to decode input tokens`
        };
      }
    }

    return validationResponse;
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
      validationResponse = (self as IValidationOptions).getTokenObjectDelegate(validationResponse, token.rawToken);
      const validation = await (self as ValidationOptions).validatorOptions.crypto.payloadProtectionProtocol.verify(
        [key],
        validationResponse.didSignature!.get(JoseConstants.tokenPayload) as Buffer,
        validationResponse.didSignature as ICryptoToken,
        (self as ValidationOptions).validatorOptions.crypto.payloadProtectionOptions);
      if (!validation.result) {
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
