/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IValidationResponse } from './IValidationResponse';
import { IValidationOptions } from '../Options/IValidationOptions';
import { ICryptoToken, JoseConstants, ProtectionFormat } from '@microsoft/crypto-sdk';
import { IDidResolveResult } from '@decentralized-identity/did-common-typescript';
import VerifiableCredentialConstants from '../VerifiableCredential/VerifiableCredentialConstants';
import ClaimToken, { TokenType } from '../VerifiableCredential/ClaimToken';
import { ISiopValidationResponse } from './SiopValidationResponse';
import ValidationOptions from '../Options/ValidationOptions';
import IValidatorOptions from '../Options/IValidatorOptions';
import { IdTokenValidationResponse } from './IdTokenValidationResponse';
import { IExpected } from '../index';
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
 * @param inputDescription Describe the type of token for error messages
 */
constructor (private validatorOptions: IValidatorOptions, private validationOptions: IValidationOptions, private inputDescription: string) {
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
  public getTokenObject (validationResponse: IValidationResponse, token: string): IValidationResponse {
    let tokenPayload: Buffer;
    const  self: any = this;
    try {
      validationResponse.didSignature = (self as ValidationOptions).validatorOptions.crypto.payloadProtectionProtocol.deserialize(
        token, 
        ProtectionFormat.JwsCompactJson, 
        (self as ValidationOptions).validatorOptions.crypto.payloadProtectionOptions);
      tokenPayload = validationResponse.didSignature!.get(JoseConstants.tokenPayload);
      if (!validationResponse.didSignature || !tokenPayload) {
        return {
          result: false,
          detailedError: `The signature in the ${(self as ValidationOptions).inputDescription} has an invalid format`,
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
          detailedError: `The protected header in the ${(self as ValidationOptions).inputDescription} does not contain the kid`,
          status: 403
        };
      }
      // Get did from kid
      const parts = kid.split('#');
      if (parts.length <= 1 ) {
        return {
          result: false,
          detailedError: `The kid in the ${(self as ValidationOptions).inputDescription} does not contain the did. Required format for kid is <did>#kid`,
          status: 403
        };
      } 
      validationResponse.did = parts[0];
    } catch (err) {
      console.error(err);
      return {
        result: false,
        detailedError: `The ${(self as ValidationOptions).inputDescription} could not be deserialized`,
        status: 400
      };
    }
    try {
      validationResponse.payloadObject = JSON.parse(tokenPayload!.toString());
    } catch (err) {
      console.error(err);
      return {
        result: false,
        detailedError: `The payload in the ${(self as ValidationOptions).inputDescription} is no valid JSON`,
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
  public async resolveDidAndGetKeys (validationResponse: IValidationResponse): Promise<IValidationResponse> {
    const  self: any = this;
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
   * @param driftInSec Drift used to extend time checks. Covers for clock drifts.
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   */
  public checkTimeValidityOnToken (validationResponse: IValidationResponse, driftInSec: number = 0): IValidationResponse {
    const  self: any = this;
    const current = new Date();
    if (validationResponse.payloadObject.exp) {
      const exp = new Date(0);
      exp.setSeconds(validationResponse.payloadObject.exp + driftInSec);
      if (exp < current) {
        return {
          result: false,
          detailedError: `The presented ${(self as ValidationOptions).inputDescription} is expired ${exp}`,
          status: 403
        };
      }
    }
    if (validationResponse.payloadObject.nbf) {
      const nbf = new Date(0);
      nbf.setSeconds(validationResponse.payloadObject.nbf - driftInSec);
      if (nbf > current) {
        return {
          result: false,
          detailedError: `The presented ${(self as ValidationOptions).inputDescription} is not yet valid ${nbf}`,
          status: 403
        };
      }
    }
    if (validationResponse.payloadObject.iat) {
      const iat = new Date(0);
      iat.setSeconds(validationResponse.payloadObject.iat - driftInSec);
      if (iat > current) {
        return {
          result: false,
          detailedError: `The presented ${(self as ValidationOptions).inputDescription} is not valid ${iat}`,
          status: 403
        };
      }
    }
    return validationResponse;
  }

 /**
   * Check the scope validity of the token such as iss and aud
   * @param validationResponse The response for the requestor
   * @param expectedSchema Expected schema of the verifiable credential
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   */
  public checkScopeValidityOnToken (validationResponse: IValidationResponse, expected: IExpected): IValidationResponse {
    const  self: any = this;

    // check iss value
    if (!expected.issuers.includes(validationResponse.payloadObject.iss)) {
      return validationResponse = {
          result: false,
          detailedError: `Wrong or missing iss property in ${(self as ValidationOptions).inputDescription}. Expected '${JSON.stringify(expected.issuers)}'`,
          status: 403
          };
    }
    
    // check aud value
    if (expected.audience && validationResponse.payloadObject.aud !== expected.audience) {
      return validationResponse = {
          result: false,
          detailedError: `Wrong or missing aud property in ${(self as ValidationOptions).inputDescription}. Expected '${expected.audience}'`,
          status: 403
          };
    }
    return validationResponse;
  }

  /**
   * Validate the DID signature on the token
   * @param validationResponse The response for the requestor
   * @param token Token to validate
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   */
  public async validateDidSignature (validationResponse: IValidationResponse, token: ICryptoToken): Promise<IValidationResponse> {
    const  self: any = this;
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
            detailedError: `The signature on the payload in the ${(self as ValidationOptions).inputDescription} is invalid`,
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
  public async fetchKeyAndValidateSignatureOnIdToken (validationResponse: IValidationResponse, token: ClaimToken): Promise<IValidationResponse> {
    const  self: any = this;

    // Get the keys to validate the token
    let keys: any;
    try {
      if (token.type === TokenType.idToken) {
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
        if (!config.issuer){
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
      return validationResponse;
    } catch (err) {
      console.error(err);
      return {
          result: false,
          status: 403,
          detailedError: `Could not validate signature`
      };
    }
  }
  
  /**
   * Decode the tokens from the SIOP request
   * @param validationResponse The response for the requestor
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   * @returns validationResponse.inputTokens List of tokens found in the SIOP
   */
  public getTokensFromSiop (validationResponse: IValidationResponse): IValidationResponse {
    const  self: any = this;
    const claims = validationResponse.payloadObject[VerifiableCredentialConstants.CLAIMS];
    if (claims) {
      const claimSources = claims[VerifiableCredentialConstants.CLAIMSOURCES];
      if (!claimSources) {
        return {
          result: false,
          status: 403,
          detailedError: `${VerifiableCredentialConstants.CLAIMSOURCES} is missing from ${VerifiableCredentialConstants.CLAIMS}`
        };
      }

      const claimNames = claims[VerifiableCredentialConstants.CLAIMNAMES];
      if (!claimNames) {
        return {
          result: false,
          status: 403,
          detailedError: `${VerifiableCredentialConstants.CLAIMNAMES} is missing from ${VerifiableCredentialConstants.CLAIMS}`
        };
      }

      // Decode tokens
      try {
        validationResponse.inputTokens = ClaimToken.getClaimTokensFromClaimSources(claimSources, claimNames);
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
  public async validateSignatureOnToken (validationResponse: IValidationResponse,  token: ClaimToken, key: any): Promise<IValidationResponse> {
    
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
            detailedError: `The presented ${(self as ValidationOptions).inputDescription} is has an invalid signature`,
            status: 403
          };
      }

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
