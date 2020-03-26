/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IValidationOptions } from '../Options/IValidationOptions';
import { IVerifiableCredentialValidation, VerifiableCredentialValidationResponse } from './VerifiableCredentialValidationResponse';
import { DidValidation } from './DidValidation';
import VerifiableCredentialConstants from '../VerifiableCredential/VerifiableCredentialConstants';
import { IExpected } from '../index';

/**
 * Class for verifiable credential validation
 */
export class VerifiableCredentialValidation implements IVerifiableCredentialValidation {

/**
 * Create a new instance of @see <VerifiableCredentialValidation>
 * @param options Options to steer the validation process
 * @param expected Expected properties of the verifiable credential
 */
  constructor (private options: IValidationOptions, private expected: IExpected) {
  }
 
  /**
   * Validate the verifiable credential
   * @param verifiableCredential The credential to validate as a signed token
   * @returns result is true if validation passes
   */
  public async validate(verifiableCredential: string): Promise<VerifiableCredentialValidationResponse> {
    let validationResponse: VerifiableCredentialValidationResponse = {
      result: true,
      status: 200
    };

    // Check the DID parts of the VC
    const didValidation = new DidValidation(this.options, this.expected);
    validationResponse = await didValidation.validate(verifiableCredential);
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
    if (!validationResponse.payloadObject.aud || validationResponse.payloadObject.aud !== this.expected.audience) {
      return {
        result: false,
        detailedError: `The DID used for the SIOP '${this.expected.audience}' is not equal to the audience of the verifiable credential ${validationResponse.payloadObject.aud}`,
        status: 403
      };
    }

    // Check if the VC matches the schema
    // Get the schema from the VC
    if (this.expected.schemas && this.expected.schemas.length > 0) {
      const context: string[] = validationResponse.payloadObject.vc[VerifiableCredentialConstants.CLAIM_CONTEXT];
      let schemaFound = false;
      let schema: string = '';
      for (let inx = 0 ; inx < context.length; inx++) {
        if (this.expected.schemas.includes(context[inx])) {
          schemaFound = true;
          schema = context[inx];
          break;
        }
      }
  
      // Check if the we found a matching schema.
      if (!schemaFound) {
        return validationResponse = {
          result: false,
          detailedError: `The verifiable credential with schema '${JSON.stringify(context)}' is not expected in '${JSON.stringify(this.expected.schemas)}`,
          status: 403
        };
      }  
    }

    // Check trusted issuers TODO

    // TODO Validate status

    return validationResponse;
  }
}
