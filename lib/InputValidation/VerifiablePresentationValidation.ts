/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { VerifiablePresentationValidationResponse, IVerifiablePresentationValidation } from './VerifiablePresentationValidationResponse';
import { IValidationOptions } from '../Options/IValidationOptions';
import ClaimToken, { TokenType } from '../VerifiableCredential/ClaimToken';
import { VerifiableCredentialValidation } from './VerifiableCredentialValidation';
import { DidValidation } from './DidValidation';

/**
 * Class for verifiable presentation validation
 */
export class VerifiablePresentationValidation implements IVerifiablePresentationValidation {

/**
 * Create a new instance of @see <VerifiablePresentationValidation>
 * @param options Options to steer the validation process
 */
  constructor (private options: IValidationOptions) {
  }
 
  /**
   * Validate the verifiable presentation
   * @param verifiablePresentationToken The presentation to validate as a signed token
   * @param siopDid The did which presented the siop
   * @param audience The expected audience for the token
   * @returns result is true if validation passes
   */
  public async validate(verifiablePresentationToken: ClaimToken, siopDid: string, audience: string): Promise<VerifiablePresentationValidationResponse> {
    let validationResponse: VerifiablePresentationValidationResponse = {
      result: true,
      detailedError: '',
      status: 200
    };
    
    // Check the DID parts of the VP
    const didValidation = new DidValidation(this.options);
    validationResponse = await didValidation.validate(verifiablePresentationToken.rawToken, audience);
    if (!validationResponse.result) {
      return validationResponse;
    }

    // Check if VP and SIOP DID are equal
    if (validationResponse.did !== siopDid) {
      return {
        result: false,
        detailedError: `The DID used for the SIOP ${siopDid} is not equal to the DID used for the verifiable presentation ${validationResponse.did}`,
        status: 403
      };
    }

    // Check presented VCs
    validationResponse = await this.validateVerifiableCredentials(validationResponse);
    if (!validationResponse.result) {
      return validationResponse;
    }

    return validationResponse;
  }

  /**
   * Validate the list of VCs
   * @param validationResponse The response for the requestor
   * @param siopDid Expected audience
   */
  private async validateVerifiableCredentials(validationResponse: VerifiablePresentationValidationResponse): Promise<VerifiablePresentationValidationResponse> {
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
    const verifiableCredentials: string[] = validationResponse.payloadObject.vp.verifiableCredential;
    if (!verifiableCredentials) {
      return {
        result: false,
        status: 403,
        detailedError: `Missing in verifiableCredential in vp`
      };
    }

    // Validate the VCs
    const validator = new VerifiableCredentialValidation(this.options);
    for (let inx = 0; inx < verifiableCredentials.length; inx++) {
      validationResponse = await validator.validate(verifiableCredentials[inx], validationResponse.did as string);
      if (!validationResponse.result) {
        return validationResponse;
      }

      // Update list of validated tokens
      const claimToken = new ClaimToken(TokenType.verifiableCredential, verifiableCredentials[inx], '');
      if (validationResponse.inputTokens) {
        validationResponse.inputTokens.push(claimToken);
      } else {
        validationResponse.inputTokens = [claimToken];
      } 
    }
    
    return validationResponse;
  }
}
