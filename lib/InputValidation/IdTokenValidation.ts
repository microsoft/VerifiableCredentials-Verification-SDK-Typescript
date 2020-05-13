/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IExpectedIdToken } from '../index';
import { IValidationOptions } from '../Options/IValidationOptions';
import ClaimToken, { TokenType } from '../VerifiableCredential/ClaimToken';
import { IdTokenValidationResponse, IIdTokenValidation } from './IdTokenValidationResponse';

/**
 * Class for id token validation
 */
export class IdTokenValidation implements IIdTokenValidation {
  /**
   * Create a new instance of @see <IdTokenValidation>
   * @param options Options to steer the validation process
   * @param expected Expected properties of the id token
   * @param siopContract Conract type asked during siop
   */
  constructor(private options: IValidationOptions, private expected: IExpectedIdToken, private siopContract: string) {
  }

  /**
   * Validate the id token
   * @param idToken The presentation to validate as a signed token
   * @param siopDid needs to be equal to audience of VC
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
    const issuers = IdTokenValidation.getIssuersFromExpected(this.expected, this.siopContract);
    if (!(issuers instanceof Array)) {
      return <IdTokenValidationResponse>issuers;
    }

    let idTokenValidated = false;
    for (let inx = 0; inx < issuers.length; inx++) {
      console.log(`Checking id token for configuration ${issuers[inx]}`);
      validationResponse = await this.options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, new ClaimToken(TokenType.idToken, idToken, issuers[inx]));
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
    validationResponse = await this.options.checkScopeValidityOnIdTokenDelegate(validationResponse, this.expected, this.siopContract);
    if (!validationResponse.result) {
      return validationResponse;
    }

    return validationResponse;
  }

  /**
   * Return expected issuers for id tokens
   * @param expected Could be a contract based object or just an array with expected issuers
   * @param siopContract The contract to which issuers are linked
   */
  public static getIssuersFromExpected(expected: IExpectedIdToken, siopContract?: string): string[] | IdTokenValidationResponse {
    if (!expected.configuration) {
      return {
        result: false,
        status: 500,
        detailedError: `Expected should have configuration issuers set for idToken`
      };
    }

    let issuers: string[];

    // Expected can provide a list of configuration or a list linked to a contract
    if (expected.configuration instanceof Array) {
      if (expected.configuration.length === 0) {
        return {
          result: false,
          status: 500,
          detailedError: `Expected should have configuration issuers set for idToken. Empty array presented.`
        };
      }
      issuers = <string[]>expected.configuration;
    } else {
      if (!siopContract) {
        return {
          result: false,
          status: 500,
          detailedError: `The siopContract needs to be specified to validate the idTokens.`
        };
      }

      // check for issuers for the contract
      if (!(<{ [contract: string]: string[] }>expected.configuration)[siopContract]) {
        return {
          result: false,
          status: 500,
          detailedError: `Expected should have configuration issuers set for idToken. Missing configuration for '${siopContract}'.`
        };
      }
      issuers = <string[]>expected.configuration[siopContract]
    }
    return issuers;
  }
}
