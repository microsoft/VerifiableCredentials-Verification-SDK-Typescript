/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IDidResolveResult } from '@decentralized-identity/did-common-typescript';
import { ICryptoToken, JoseConstants, ProtectionFormat } from '@microsoft/crypto-sdk';
import base64url from "base64url";
import { IExpected } from '../index';
import { IValidationOptions } from '../Options/IValidationOptions';
import IValidatorOptions from '../Options/IValidatorOptions';
import ValidationOptions from '../Options/ValidationOptions';
import ClaimToken, { TokenType } from '../VerifiableCredential/ClaimToken';
import VerifiableCredentialConstants from '../VerifiableCredential/VerifiableCredentialConstants';
import { IdTokenValidationResponse } from './IdTokenValidationResponse';
import { IValidationResponse } from './IValidationResponse';

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
  constructor(private validatorOptions: IValidatorOptions, private validationOptions: IValidationOptions, private inputDescription: TokenType) {
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
          detailedError: `The signature in the ${(self as ValidationOptions).expectedInput} has an invalid format`,
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
          detailedError: `The protected header in the ${(self as ValidationOptions).expectedInput} does not contain the kid`,
          status: 403
        };
      }
    } catch (err) {
      console.error(err);
      return {
        result: false,
        detailedError: `The ${(self as ValidationOptions).expectedInput} could not be deserialized`,
        status: 400
      };
    }
    try {
      validationResponse.payloadObject = JSON.parse(tokenPayload!.toString());
    } catch (err) {
      console.error(err);
      return {
        result: false,
        detailedError: `The payload in the ${(self as ValidationOptions).expectedInput} is no valid JSON`,
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
   * @param driftInSec Drift used to extend time checks. Covers for clock drifts.
   * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
   */
  public checkTimeValidityOnToken(validationResponse: IValidationResponse, driftInSec: number = 0): IValidationResponse {
    const self: any = this;
    const current = Math.trunc(Date.now()/1000);    
    if (validationResponse.payloadObject.exp) {
      // initialize in utc time
      const exp =  (validationResponse.payloadObject.exp + driftInSec);

      if (exp < current) {
        return {
          result: false,
          detailedError: `The presented ${(self as ValidationOptions).expectedInput} is expired ${exp}, now ${current as number}`,
          status: 403
        };
      }
    }
    if (validationResponse.payloadObject.nbf) {
      // initialize in utc time
      const nbf = (validationResponse.payloadObject.nbf - driftInSec);
      
      if (nbf > current) {
        return {
          result: false,
          detailedError: `The presented ${(self as ValidationOptions).expectedInput} is not yet valid ${nbf}`,
          status: 403
        };
      }
    }
    if (validationResponse.payloadObject.iat) {
      // initialize in utc time
      const iat = (validationResponse.payloadObject.iat - driftInSec);

      if (iat > current) {
        return {
          result: false,
          detailedError: `The presented ${(self as ValidationOptions).expectedInput} is not valid ${iat}`,
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
    * @returns validationResponse.result, validationResponse.status, validationResponse.detailedError
    */
   public checkScopeValidityOnIdToken(validationResponse: IValidationResponse, expected: IExpected): IValidationResponse {
    const self: any = this;

    // check iss value
    if ((validationResponse as IdTokenValidationResponse).issuer) {
      // For id tokens we need to check whether the issuer in configuration matches the iss in the payload
      // The issuer property is set during the fetching of the configuration on it is already checked that this configuration matches the public key of the token signature
      if (validationResponse.payloadObject.iss !== (validationResponse as IdTokenValidationResponse).issuer) {
        return validationResponse = {
          result: false,
          detailedError: `The issuer found in the configuration of the id token ${(validationResponse as IdTokenValidationResponse).issuer} does not match the iss property ${validationResponse.payloadObject.iss}`,
          status: 403
        };
      }
    } else if (expected.issuers && !expected.issuers!.includes(validationResponse.payloadObject.iss)) {
      return validationResponse = {
        result: false,
        detailedError: `Wrong or missing iss property in ${(self as ValidationOptions).expectedInput}. Expected '${JSON.stringify(expected.issuers)}'`,
        status: 403
      };
    }
    // TODO change validation check
    return validationResponse;
    
    // check sub value
    if (expected.audience && validationResponse.payloadObject.sub !== expected.audience) {
      return validationResponse = {
        result: false,
        detailedError: `Wrong or missing sub property in ${(self as ValidationOptions).expectedInput}. Expected '${expected.audience}'`,
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
   public checkScopeValidityOnToken(validationResponse: IValidationResponse, expected: IExpected): IValidationResponse {
    const self: any = this;

    // check iss value
    if (!validationResponse.payloadObject.iss) {
      return validationResponse = {
        result: false,
        detailedError: `Missing iss property in ${(self as ValidationOptions).expectedInput}. Expected '${JSON.stringify(expected.issuers)}'`,
        status: 403
      };
    }

   if (expected.issuers && !expected.issuers!.includes(validationResponse.payloadObject.iss)) {
      return validationResponse = {
        result: false,
        detailedError: `Wrong iss property in ${(self as ValidationOptions).expectedInput}. Expected '${JSON.stringify(expected.issuers)}'`,
        status: 403
      };
    }
    
    // check aud value
    if(expected.audience)
    {
      if (!validationResponse.payloadObject.aud) {
        return validationResponse = {
          result: false,
          detailedError: `Missing aud property in ${(self as ValidationOptions).expectedInput}. Expected '${expected.audience}'`,
          status: 403
        };
      }
  
      if (validationResponse.payloadObject.aud !== expected.audience) {
        return validationResponse = {
          result: false,
          detailedError: `Wrong aud property in ${(self as ValidationOptions).expectedInput}. Expected '${expected.audience}'`,
          status: 403
        };
      }
    }

    // check sub value
    if(expected.subject)
    {
      if (!validationResponse.payloadObject.sub) {
        return validationResponse = {
          result: false,
          detailedError: `Missing sub property in ${(self as ValidationOptions).expectedInput}. Expected '${expected.subject}'`,
          status: 403
        };
      }
  
      if (validationResponse.payloadObject.sub !== expected.subject) {
        return validationResponse = {
          result: false,
          detailedError: `Wrong sub property in ${(self as ValidationOptions).expectedInput}. Expected '${expected.subject}'`,
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
          detailedError: `The signature on the payload in the ${(self as ValidationOptions).expectedInput} is invalid`,
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
          detailedError: `The presented ${(self as ValidationOptions).expectedInput} is has an invalid signature`,
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
