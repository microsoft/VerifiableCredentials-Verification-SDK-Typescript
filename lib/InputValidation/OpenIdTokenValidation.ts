/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IExpectedOpenIdToken } from '../Options/IExpected';
import { IdTokenValidationResponse } from './IdTokenValidationResponse';
import { IValidationOptions } from '../Options/IValidationOptions';
import ClaimToken, { TokenType } from '../VerifiableCredential/ClaimToken';
import { BaseIdTokenValidation } from './BaseIdTokenValidation';

/**
 * Class for validating any general Open id Token
 */
export class OpenIdTokenValidation extends BaseIdTokenValidation {
  /**
   * Create a new instance of @see <IdTokenValidation>
   * @param options Options to steer the validation process
   * @param expected Expected properties of the id token
   * @param configuration the open id configuration endpoint
   */
  constructor(options: IValidationOptions, private expected: IExpectedOpenIdToken) {
    super(options, expected);
  }

  protected async downloadConfigurationAndValidate(validationResponse: IdTokenValidationResponse, idToken: string): Promise<IdTokenValidationResponse> {
    console.log(`Checking id token for configuration ${this.expected.configuration}`);
    return await this.options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, new ClaimToken(TokenType.idToken, idToken, this.expected.configuration));
  }
}
