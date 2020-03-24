/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IValidationOptions } from '../Options/IValidationOptions';
import ClaimToken from '../VerifiableCredential/ClaimToken';
import { IIdTokenValidation, IdTokenValidationResponse } from './IdTokenValidationResponse';

//#region delegate types

//#endregion

/**
 * Class for id token validation
 */
export class IdTokenValidation implements IIdTokenValidation {
/**
 * Create a new instance of @see <IdTokenValidation>
 * @param options Options to steer the validation process
 * @param expectedIssuers Expected issuer list
 */
constructor (private options: IValidationOptions, private expectedIssuers: string[]) {
}
 
  /**
   * Validate the id token
   * @param idToken The presentation to validate as a signed token
   * @param audience The expected audience for the token
   * @returns result is true if validation passes
   */
  public async validate(idToken: ClaimToken, audience: string): Promise<IdTokenValidationResponse> {
    let validationResponse: IdTokenValidationResponse = {
      result: true,
      detailedError: '',
      status: 200
    };

    // Deserialize id token token
    validationResponse = this.options.getTokenObjectDelegate(validationResponse, idToken.rawToken);
    if (!validationResponse.result) {
      return validationResponse;
    }
    
    // Validate token signature
    validationResponse = await this.options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
    if (!validationResponse.result) {
      return validationResponse;
    }

    // Check token time validity
    validationResponse = await this.options.checkTimeValidityOnTokenDelegate(validationResponse);
    if (!validationResponse.result) {
      return validationResponse;
    }

    // Check token scope (aud and iss)
    validationResponse = await this.options.checkScopeValidityOnTokenDelegate(validationResponse, validationResponse.issuer as string, audience);
    if (!validationResponse.result) {
      return validationResponse;
    }

    // Check if the id token matches the expected issuers TODO


    return validationResponse;
  }

  
}
