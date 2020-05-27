/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { VerifiablePresentationValidationResponse, IVerifiablePresentationValidation } from './VerifiablePresentationValidationResponse';
import { IValidationOptions } from '../Options/IValidationOptions';
import ClaimToken from '../VerifiableCredential/ClaimToken';
import { DidValidation } from './DidValidation';
import VerifiableCredentialConstants from '../VerifiableCredential/VerifiableCredentialConstants';
import { IExpectedVerifiablePresentation } from '../index';
import { Crypto } from '../index';
import { KeyReferenceOptions } from 'verifiablecredentials-crypto-sdk-typescript';

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
  constructor (private options: IValidationOptions, private expected: IExpectedVerifiablePresentation, private siopDid: string, private id: string, private crypto: Crypto ) {
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

   // Check token scope (aud and iss)
   validationResponse = await this.options.checkScopeValidityOnVpTokenDelegate(validationResponse, this.expected, this.siopDid);
   if (!validationResponse.result) {
     return validationResponse;
   }

    // Check if VP and SIOP DID are equal
    if (this.siopDid && validationResponse.did !== this.siopDid) {
      return {
        result: false,
        detailedError: `The DID used for the SIOP ${this.siopDid} is not equal to the DID used for the verifiable presentation ${validationResponse.did}`,
        status: 403
      };
    }

    if (!validationResponse.payloadObject.vp) {
      return {
        result: false,
        status: 403,
        detailedError: `Missing vp in presentation`
      };
    }

    if (!validationResponse.payloadObject.vp['@context']) {
      return {
        result: false,
        status: 403,
        detailedError: `Missing @context in presentation`
      };
    }

    if (!validationResponse.payloadObject.vp.type || validationResponse.payloadObject.vp.type[0] !== VerifiableCredentialConstants.DEFAULT_VERIFIABLEPRESENTATION_TYPE) {
      return {
        result: false,
        status: 403,
        detailedError: `Missing or wrong default type in vp of presentation. Should be ${VerifiableCredentialConstants.DEFAULT_VERIFIABLEPRESENTATION_TYPE}`
      };
    }


    validationResponse.tokensToValidate = this.setVcTokens(validationResponse.payloadObject.vp.verifiableCredential);
    if (!validationResponse.tokensToValidate) {
      return {
        result: false,
        status: 403,
        detailedError: `Missing verifiableCredential in presentation`
      };
    }

    return validationResponse;
  }

  public async checkVpStatus(verifiablePresentationToken: string) {

    const payload: any = {
      did: this.crypto.builder.did,
      kid: `${this.crypto.builder.did}#${this.crypto.builder.signingKeyReference}`,
      vc: verifiablePresentationToken
    };
    const key = this.crypto.builder.signingKeyReference;
    const siop = await this.crypto.builder.payloadProtectionProtocol.sign(
      // TODO needs support for extractable and non extractable keys
      new KeyReferenceOptions({ keyReference: key, extractable: true }),
      Buffer.from(JSON.stringify(payload)),
      'JwsCompactJson',
      this.crypto.builder.payloadProtectionOptions);

      console.log(`verifiablePresentation status check`);
      //let response = await fetch();

  }

  private setVcTokens(vc: string[]) {
    if (!vc) {
      return undefined;
    }
    const decodedToken: {[key: string]: ClaimToken } = {};
    for (let token in vc) {
      const claimToken = ClaimToken.getTokenType(vc[token]);
      decodedToken[this.id] = claimToken;
    }
    return decodedToken;
  }
}
