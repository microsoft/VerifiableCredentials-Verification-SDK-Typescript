/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IValidationOptions } from '../Options/IValidationOptions';
import ClaimToken, { TokenType } from '../VerifiableCredential/ClaimToken';
import { IIdTokenValidation, IdTokenValidationResponse } from './IdTokenValidationResponse';
import { IExpected } from '..';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

//#region delegate types

//#endregion

/**
 * Class for id token validation
 */
export class IdTokenValidation implements IIdTokenValidation {
/**
 * Create a new instance of @see <IdTokenValidation>
 * @param options Options to steer the validation process
 * @param expected Expected properties of the id token
 */
constructor (private options: IValidationOptions, private expected: IExpected) {
}
 
  /**
   * Validate the id token
   * @param idToken The presentation to validate as a signed token
   * @returns result is true if validation passes
   */
  public async validate(idToken: string): Promise<IdTokenValidationResponse> {
    let validationResponse: IdTokenValidationResponse = {
      result: true,
      detailedError: '',
      status: 200
    };

    // Deserialize id token token
    validationResponse = this.options.getTokenObjectDelegate(validationResponse, idToken);
    if (!validationResponse.result) {
      return validationResponse;
    }
    
    // Validate token signature
    if (!this.expected.configurations) {
      return {
        result: false,
        status: 500,
        detailedError: `Expected should have configurations set`
      };
    }

    let idTokenValidated = false
    for (let inx = 0; inx < this.expected.configurations.length; inx ++) {
      validationResponse = await this.options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, new ClaimToken(TokenType.idToken, idToken, this.expected.configurations[inx]));
      if (validationResponse.result) {
        idTokenValidated = true;
        break;
      }
    }
    if (!idTokenValidated) {
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

    // Check if the id token matches the expected issuers TODO


    return validationResponse;
  }

  
}
