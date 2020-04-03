/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { VerifiablePresentationValidationResponse, IVerifiablePresentationValidation } from './VerifiablePresentationValidationResponse';
import { IValidationOptions } from '../Options/IValidationOptions';
import ClaimToken from '../VerifiableCredential/ClaimToken';
import { DidValidation } from './DidValidation';
import { IExpected } from '../index';

/**
 * Class for verifiable presentation validation
 */
export class VerifiablePresentationValidation implements IVerifiablePresentationValidation {

  /**
   * Create a new instance of @see <VerifiablePresentationValidation>
   * @param options Options to steer the validation process
   * @param expected Expected properties of the verifiable presentation
   * @param siopDid needs to be equal to audience of VC
   */
  constructor (private options: IValidationOptions, private expected: IExpected, private siopDid: string) {
  }
 
  /**
   * Validate the verifiable presentation
   * @param verifiablePresentationToken The presentation to validate as a signed token
   * @param siopDid The did which presented the siop
   * @returns result is true if validation passes
   */
  public async validate(verifiablePresentationToken: string): Promise<VerifiablePresentationValidationResponse> {
    let validationResponse: VerifiablePresentationValidationResponse = {
      result: true,
      detailedError: '',
      status: 200
    };
    
    // Check the DID parts of the VP
    const didValidation = new DidValidation(this.options, this.expected);
    validationResponse = await didValidation.validate(verifiablePresentationToken);
    if (!validationResponse.result) {
      return validationResponse;
    }

    // Set list of tokens to validate
    validationResponse.tokensToValidate = validationResponse.payloadObject.vp!.verifiableCredential;

    // Check if VP and SIOP DID are equal
    if (this.siopDid && validationResponse.did !== this.siopDid) {
      return {
        result: false,
        detailedError: `The DID used for the SIOP ${this.siopDid} is not equal to the DID used for the verifiable presentation ${validationResponse.did}`,
        status: 403
      };
    }

    if (!validationResponse.payloadObject && !validationResponse.payloadObject.vp) {
      return {
        result: false,
        status: 403,
        detailedError: `Missing in vp in presentation`
      };
    }

    if (!validationResponse.payloadObject.vp['@context']) {
      return {
        result: false,
        status: 403,
        detailedError: `Missing in @context in vp`
      };
    }

    validationResponse.tokensToValidate = this.setVcTokens(validationResponse.payloadObject.vp.verifiableCredential);
    if (!validationResponse.tokensToValidate) {
      return {
        result: false,
        status: 403,
        detailedError: `Missing in verifiableCredential in vp`
      };
    }

    return validationResponse;
  }

  private setVcTokens(vc: string[]) {
    const decodedToken: {[key: string]: ClaimToken } = {};
    for (let token in vc) {
      const claimToken = ClaimToken.getTokenType(vc[token]);
      decodedToken[claimToken.decodedToken.jti] = claimToken;
    }
    return decodedToken;
  }
}
