/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IExpectedIdToken } from '../options/IExpected';
import { IdTokenValidationResponse } from './IdTokenValidationResponse';
import { IValidationOptions } from '../options/IValidationOptions';
import ClaimToken, { TokenType } from '../verifiable_credential/ClaimToken';
import { BaseIdTokenValidation } from './BaseIdTokenValidation';
import ErrorHelpers from '../error_handling/ErrorHelpers';
const errorCode = (error: number) => ErrorHelpers.errorCode('VCSDKIDVA', error);

/**
 * Class for id token validation for the Verifiable Credential attestation scenario
 */
export class IdTokenValidation extends BaseIdTokenValidation {
  /**
   * Create a new instance of @see <IdTokenValidation>
   * @param options Options to steer the validation process
   * @param expected Expected properties of the id token
   * @param siopContract Conract type asked during siop
   */
  constructor(options: IValidationOptions, private expected: IExpectedIdToken, private siopContract: string) {
    super(options, expected);
  }

  /**
   * Return expected issuers for id tokens
   * @param expected Could be a contract based object or just an array with expected issuers
   * @param siopContract The contract to which issuers are linked
   */
  private getIssuersFromExpected(): string[] | IdTokenValidationResponse {
    if (!this.expected.configuration) {
      return {
        result: false,
        status: 500,
        code: errorCode(1),
        detailedError: `Expected should have configuration issuers set for idToken`
      };
    }

    let issuers: string[];

    // Expected can provide a list of configuration or a list linked to a contract
    if (this.expected.configuration instanceof Array) {
      if (this.expected.configuration.length === 0) {
        return {
          result: false,
          status: 500,
          code: errorCode(2),
          detailedError: `Expected should have configuration issuers set for idToken. Empty array presented.`
        };
      }
      issuers = <string[]>this.expected.configuration;
    } else {
      if (!this.siopContract) {
        return {
          result: false,
          status: 500,
          code: errorCode(3),
          detailedError: `The siopContract needs to be specified to validate the idTokens.`
        };
      }

      // check for issuers for the contract
      if (!(<{ [contract: string]: string[] }>this.expected.configuration)[this.siopContract]) {
        return {
          result: false,
          status: 500,
          code: errorCode(4),
          detailedError: `Expected should have configuration issuers set for idToken. Missing configuration for '${this.siopContract}'.`
        };
      }
      issuers = <string[]>this.expected.configuration[this.siopContract]
    }
    return issuers;
  }

  protected async downloadConfigurationAndValidate(validationResponse: IdTokenValidationResponse, idToken: string): Promise<IdTokenValidationResponse> {
    // Validate token signature    
    const issuers = this.getIssuersFromExpected();
    if (!(issuers instanceof Array)) {
      return <IdTokenValidationResponse>issuers;
    }

    const arr = <string[]>issuers;
    let idTokenValidated = false;
    for (let inx = 0; inx < arr.length; inx++) {
      validationResponse = await this.options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, new ClaimToken(TokenType.idToken, idToken, arr[inx]));
      
      if (validationResponse.result) {
        return validationResponse;
      }
    }

    // this is broken, if all failed only the last one gets returned
    return validationResponse;
  }
}
