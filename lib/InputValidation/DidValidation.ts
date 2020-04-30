/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ICryptoToken } from '@microsoft/crypto-sdk';
import { IDidValidation, IDidValidationResponse } from './DidValidationResponse';
import { IValidationOptions } from '../Options/IValidationOptions';
import { IExpected, ValidationOptions } from '..';

/**
 * Class for input validation of a token signed with DID key
 */
export class DidValidation implements IDidValidation {

/**
 * Create a new instance of @see <DidValidation>
 * @param options Options to steer the validation process
 * @param expectedSchema Expected schema of the verifiable credential
 */
  constructor (private options: IValidationOptions, private expected: IExpected) {
  }

  /**
   * Validate the token for a correct format and signature
   * @param token Token to validate
   * @returns true if validation passes together with parsed objects
   */
  public async validate (token: string): Promise<IDidValidationResponse> {
    let validationResponse: IDidValidationResponse = {
      result: true,
      status: 200
    };

    // Deserialize the token
    validationResponse = this.options.getTokenObjectDelegate(validationResponse, token);
    if (!validationResponse.result) {
      return validationResponse;
    }

     // Get did from kid
     const parts = validationResponse.didKid!.split('#');
     if (parts.length <= 1) {
       return {
         result: false,
         detailedError: `The kid in does not contain the did. Required format for kid is <did>#kid`,
         status: 403
       };
     }
     validationResponse.did = parts[0];
    // Get DID from the payload
    if (!validationResponse.did) {
      return validationResponse = {
          result: false,
          detailedError: 'The input token does not contain the DID',
          status: 403
        };
    }

   // Resolve DID, get document and retrieve public key
   validationResponse = await this.options.resolveDidAndGetKeysDelegate(validationResponse);
   if (!validationResponse.result) {
     return validationResponse;
   }
    
   // Validate DID signature
   validationResponse = await this.options.validateDidSignatureDelegate(validationResponse, validationResponse.didSignature as ICryptoToken);
   if (!validationResponse.result) {
     return validationResponse;
   }

   // Check token time validity
   validationResponse = await this.options.checkTimeValidityOnTokenDelegate(validationResponse);
   if (!validationResponse.result) {
     return validationResponse;
   }

   // Check token scope (aud and iss)
   validationResponse = await this.options.checkScopeValidityOnTokenDelegate(validationResponse, this.expected);
   if (!validationResponse.result) {
     return validationResponse;
   }

   // once the token is validated, we can trust the jti
   validationResponse.jti = validationResponse.payloadObject.jti;

   console.log(`The signature is verified with DID ${validationResponse.did}`);
   return validationResponse;
  }
}
