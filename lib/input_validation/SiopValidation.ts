/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ISiopValidation, ISiopValidationResponse } from './SiopValidationResponse';
import { DidValidation } from './DidValidation';
import { IValidationOptions } from '../options/IValidationOptions';
import { IExpectedSiop } from '../index';

/**
 * Class for siop validation
 */
export class SiopValidation implements ISiopValidation {

  /**
   * Create a new instance of @see <SiopValidation>
   * @param options Options to steer the validation process
   * @param expected Expected properties of the SIOP
   */
  constructor(private options: IValidationOptions, private expected: IExpectedSiop) {
  }

  /**
   * Validate the input for a correct format and signature
   * @param siop The SIOP token
   * @returns true if validation passes together with parsed objects
   */
  public async validate(siop: string): Promise<ISiopValidationResponse> {
    let validationResponse: ISiopValidationResponse = {
      result: true,
      status: 200
    };

    // Check the DID parts of the siop
    const didValidation = new DidValidation(this.options, this.expected);
    validationResponse = await didValidation.validate(siop);
    if (!validationResponse.result) {
      return validationResponse;
    }

    // Check token scope (aud and iss)
    validationResponse = await this.options.checkScopeValidityOnSiopTokenDelegate(validationResponse, this.expected);
    if (!validationResponse.result) {
      return validationResponse;
    }
    
    return validationResponse;
  }
}
