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
   * @param siopDid needs to be equal to audience of VC
   */
  constructor(private options: IValidationOptions, private expected: IExpected, private siopDid: string) {
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
    validationResponse.did = validationResponse.payloadObject.iss;

    // Check token scope (aud and iss)
    validationResponse = await this.options.checkScopeValidityOnVcTokenDelegate(validationResponse, this.expected, this.siopDid);
    if (!validationResponse.result) {
      return validationResponse;
    }

    // Check if the VC matches the contract
    // Get the contract from the VC
    if (this.expected.contracts && this.expected.contracts.length > 0) {
      const context: string[] = validationResponse.payloadObject.vc[VerifiableCredentialConstants.CLAIM_CONTEXT];
      let contractFound = false;
      let contract: string = '';
      for (let inx = 0; inx < context.length; inx++) {
        if (this.expected.contracts.includes(context[inx])) {
          contractFound = true;
          contract = context[inx];
          break;
        }
      }

      // Check if the we found a matching contract.
      if (!contractFound) {
        return validationResponse = {
          result: false,
          detailedError: `The verifiable credential with contract '${JSON.stringify(context)}' is not expected in '${JSON.stringify(this.expected.contracts)}'`,
          status: 403
        };
      }
    }

    // TODO Validate status

    return validationResponse;
  }
}
