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

require('es6-promise').polyfill();
require('isomorphic-fetch');

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

    return this.checkVpStatus(validationResponse, verifiablePresentationToken);
  }

  public async checkVpStatus(validationResponse: VerifiablePresentationValidationResponse, verifiablePresentationToken: string): Promise<VerifiablePresentationValidationResponse> {
    
    validationResponse = await this.options.resolveDidAndGetKeysDelegate(validationResponse);
    if (!validationResponse.result) {
      return validationResponse;
    }

    //construct payload
    const publicKey = await validationResponse.didDocument?.getPublicKey(`${this.crypto.builder.did}#${this.crypto.builder.signingKeyReference}`);
    const payload: any = {
      did: this.crypto.builder.did,
      kid: `${this.crypto.builder.did}#${this.crypto.builder.signingKeyReference}`,
      vc: verifiablePresentationToken,
      sub_jwk: publicKey?.publicKeyJwk
    };

    // get status url, restricted to one VC for the moment TODO
    const allProperties = Object.keys(validationResponse.tokensToValidate!);

    const vcToValidate: any = validationResponse.tokensToValidate![allProperties[0]];
    const statusUrl = vcToValidate.decodedToken.vc.credentialStatus && vcToValidate.decodedToken.vc.credentialStatus.id ? 
      vcToValidate.decodedToken.vc.credentialStatus.id :
      undefined;

    if (!statusUrl) {
      console.log(`verifiableCredential '${vcToValidate.jti}' has not status endpoint`);
      return validationResponse;
    }

    // send the payload
    const siop = await this.crypto.builder.payloadProtectionProtocol.sign(
      // TODO needs support for extractable and non extractable keys
      new KeyReferenceOptions({ keyReference: this.crypto.builder.signingKeyKid, extractable: true }),
      Buffer.from(JSON.stringify(payload)),
      'JwsCompactJson',
      this.crypto.builder.payloadProtectionOptions);

      console.log(`verifiablePresentation status check`);
      let response = await fetch(statusUrl, {
        method: 'POST',
        body: siop.serialize()
      });
      if (!response.ok) {
        return {
          result: false,
          status: 403,
          detailedError: `status check could not fetch response from ${statusUrl}`
        };
      }

      return validationResponse;
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
