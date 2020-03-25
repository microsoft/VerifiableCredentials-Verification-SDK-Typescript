/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IValidationOptions } from '../Options/IValidationOptions';
import { IVerifiableCredentialValidation, VerifiableCredentialValidationResponse } from './VerifiableCredentialValidationResponse';
import { DidValidation } from './DidValidation';

/**
 * Class for verifiable credential validation
 */
export class VerifiableCredentialValidation implements IVerifiableCredentialValidation {

/**
 * Create a new instance of @see <VerifiableCredentialValidation>
 * @param options Options to steer the validation process
 */
  constructor (private options: IValidationOptions) {
  }
 
  /**
   * Validate the verifiable credential
   * @param verifiableCredential The credential to validate as a signed token
   * @param siopDid The did which presented the siop
   * @returns result is true if validation passes
   */
  public async validate(verifiableCredential: string, siopDid: string): Promise<VerifiableCredentialValidationResponse> {
    let validationResponse: VerifiableCredentialValidationResponse = {
      result: true,
      status: 200
    };

    
    // Check the DID parts of the VC
    const didValidation = new DidValidation(this.options);
    validationResponse = await didValidation.validate(verifiableCredential, siopDid);
    if (!validationResponse.result) {
      return validationResponse;
    }

    // Get issuer from verifiable credential payload
    validationResponse.did = validationResponse.payloadObject.issuer;
    if (!validationResponse.did) {
      return validationResponse = {
          result: false,
          detailedError: 'The verifiable credential does not contain the issuer property',
          status: 403
      };
    }

    // Check if VC audience and SIOP DID are equal
    if (validationResponse.payloadObject.aud !== siopDid) {
      return {
        result: false,
        detailedError: `The DID used for the SIOP ${siopDid} is not equal to the audience of the verifiable credential ${validationResponse.payloadObject.aud}`,
        status: 403
      };
    }

    // Populate the VC TODO

    // Check if the VC matches the schema TODO

    // Check trusted issuers TODO

    // TODO Validate status

    return validationResponse;
  }
}
