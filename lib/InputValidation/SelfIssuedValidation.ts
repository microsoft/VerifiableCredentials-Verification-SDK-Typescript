/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDidValidation, IDidValidationResponse } from './DidValidationResponse';
import { IValidationOptions } from '../Options/IValidationOptions';
import { IExpected } from '../index';
import base64url from "base64url";

/**
 * Class for input validation of a token signed with DID key
 */
export class SelfIssuedValidation implements IDidValidation {

/**
 * Create a new instance of  <see @class SelfIssuedValidation>
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
   validationResponse = this.options.getSelfIssuedTokenObjectDelegate(validationResponse, token);    
   return validationResponse;
  }
}
