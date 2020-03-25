/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import VerifiableCredentialConstants from '../VerifiableCredential/VerifiableCredentialConstants';
import { ISiopValidation, ISiopValidationResponse } from './SiopValidationResponse';
import { DidValidation } from './DidValidation';
import { IValidationOptions } from '../Options/IValidationOptions';

/**
 * Class for siop validation
 */
export class SiopValidation implements ISiopValidation {

/**
 * Create a new instance of @see <SiopValidation>
 * @param options Options to steer the validation process
 */
  constructor (private options: IValidationOptions) {
  }

  /**
   * Validate the input for a correct format and signature
   * @param siop Authentication of requestor
   * @param audience The expected audience in the token
   * @returns true if validation passes together with parsed objects
   */
  public async validate (siop: string, audience: string): Promise<ISiopValidationResponse> {
    let validationResponse: ISiopValidationResponse = {
      result: true,
      status: 200
    };

    // Check the DID parts of the siop
    const didValidation = new DidValidation(this.options);
    validationResponse = await didValidation.validate(siop, audience, VerifiableCredentialConstants.TOKEN_SI_ISS);
    if (!validationResponse.result) {
      return validationResponse;
    }

    // Get input for the requested VC
    validationResponse = await this.options.getClaimBagDelegate(validationResponse);
    if (!validationResponse.result) {
      return validationResponse;
    }
  
    console.log(`The SIOP signature is verified with DID ${validationResponse.did}`);
    return validationResponse;
  }
}
