/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ISiopValidation, ISiopValidationResponse } from './SiopValidationResponse';
import { DidValidation } from './DidValidation';
import { IValidationOptions } from '../options/IValidationOptions';
import { ClaimToken, IExpectedSiop } from '../index';
import ErrorHelpers from '../error_handling/ErrorHelpers';
const errorCode = (error: number) => ErrorHelpers.errorCode('VCSDKSIVa', error);

/**
 * Class for siop validation
 */
export class SiopValidation implements ISiopValidation {

  /**
   * Create a new instance of @see <SiopValidation>
   * @param options Options to steer the validation process
   * @param expected Expected properties of the SIOP
   */
  constructor(protected options: IValidationOptions, protected expected: IExpectedSiop) {
    this._didValidation = new DidValidation(this.options, this.expected);
  }

  private _didValidation: DidValidation;

  public get didValidation(): DidValidation {
    return this._didValidation;
  }

  public set didValidation(validator: DidValidation) {
    this._didValidation = validator;
  }

  /**
   * Validate the input for a correct format and signature
   * @param siop The SIOP token
   * @returns true if validation passes together with parsed objects
   */
  public async validate(siop: ClaimToken): Promise<ISiopValidationResponse> {
    // if the token was already validated, we're done
    if (siop.validationResponse) {
      return siop.validationResponse;
    }

    // Check the DID parts of the siop
    let validationResponse = await this.didValidation.validate(siop.rawToken);
    if (!validationResponse.result) {
      return siop.validationResponse = validationResponse;
    }

    // Check token scope (aud and iss)
    validationResponse = this.options.checkScopeValidityOnSiopTokenDelegate(validationResponse, this.expected);
    if (!validationResponse.result) {
      return siop.validationResponse = validationResponse;
    }

    if (!validationResponse.tokenId) {
      return siop.validationResponse = {
        result: false,
        code: errorCode(1),
        detailedError: `The SIOP token identifier (jti/id) is missing`,
        status: 400
      };
    }

    return siop.validationResponse = validationResponse;
  }
}
