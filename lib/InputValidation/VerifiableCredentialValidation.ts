/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IValidationOptions } from '../Options/IValidationOptions';
import { IVerifiableCredentialValidation, VerifiableCredentialValidationResponse } from './VerifiableCredentialValidationResponse';
import { DidValidation } from './DidValidation';
import { IExpectedVerifiableCredential } from '../index';
import VerifiableCredentialConstants from '../VerifiableCredential/VerifiableCredentialConstants';
import { isContext } from 'vm';

/**
 * Class for verifiable credential validation
 */
export class VerifiableCredentialValidation implements IVerifiableCredentialValidation {

  /**
   * Create a new instance of @see <VerifiableCredentialValidation>
   * @param options Options to steer the validation process
   * @param expected Expected properties of the verifiable credential
   */
  constructor(private options: IValidationOptions, private expected: IExpectedVerifiableCredential) {
  }

  /**
   * Validate the verifiable credential
   * @param verifiableCredential The credential to validate as a signed token
   * @param siopDid needs to be equal to audience of VC
   * @returns result is true if validation passes
   */
  public async validate(verifiableCredential: string, siopDid: string): Promise<VerifiableCredentialValidationResponse> {
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

    if (!validationResponse.payloadObject.vc) {
      return {
        result: false,
        detailedError: `The verifiable credential does not has the vc property`,
        status: 403
      };
    }

    const context: string[] = validationResponse.payloadObject.vc[VerifiableCredentialConstants.CLAIM_CONTEXT];
    if (!context || context.length === 0) {
      return {
        result: false,
        detailedError: `The verifiable credential vc property does not contain ${VerifiableCredentialConstants.CLAIM_CONTEXT}`,
        status: 403
      };
    }

    if (context[0] !== VerifiableCredentialConstants.DEFAULT_VERIFIABLECREDENTIAL_CONTEXT) {
      return {
        result: false,
        detailedError: `The verifiable credential context first element should be ${VerifiableCredentialConstants.DEFAULT_VERIFIABLECREDENTIAL_CONTEXT}`,
        status: 403
      };
    }

    const types: string[] = validationResponse.payloadObject.vc.type;
    if (!types || types.length === 0) {
      return {
        result: false,
        detailedError: `The vc property does not contain type`,
        status: 403
      };
    }

    if (types.length < 2) {
      return {
        result: false,
        detailedError: `The verifiable credential type property should have two elements`,
        status: 403
      };
    }

    if (types[0] !== VerifiableCredentialConstants.DEFAULT_VERIFIABLECREDENTIAL_TYPE) {
      return {
        result: false,
        detailedError: `The verifiable credential type first element should be ${VerifiableCredentialConstants.DEFAULT_VERIFIABLECREDENTIAL_TYPE}`,
        status: 403
      };
    }


    // get vc type
    const vcType: string = types[1];

    // Check token scope (aud and iss)
    validationResponse = await this.options.checkScopeValidityOnVcTokenDelegate(validationResponse, this.expected, siopDid);
    if (!validationResponse.result) {
      return validationResponse;
    }

    // Check if the VC matches the contract and its issuers
    // Get the contract from the VC
    if (this.expected.contractIssuers) {
      const contractIssuers = this.expected.contractIssuers[vcType];
      
      // Check if the we found a matching contract.
      if (!contractIssuers) {
        return {
          result: false,
          detailedError: `The verifiable credential with contract '${vcType}' is not expected in '${JSON.stringify(this.expected.contractIssuers)}'`,
          status: 403
        };
      }

      if (!contractIssuers.includes(validationResponse.payloadObject.iss)) {
        return {
          result: false,
          detailedError: `The verifiable credential with contract '${vcType}' is not from a trusted issuer '${JSON.stringify(this.expected.contractIssuers)}'`,
          status: 403
        };
      }
    }

    // TODO Validate status

    return validationResponse;
  }

}
