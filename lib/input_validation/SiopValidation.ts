/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import ErrorHelpers from '../error_handling/ErrorHelpers';
import { ClaimToken, createJwkThumbprint, IExpectedSiop } from '../index';
import { IValidationOptions } from '../options/IValidationOptions';
import { DidValidation } from './DidValidation';
import { ISiopValidation, ISiopValidationResponse } from './SiopValidationResponse';
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

    // siop validation is being overloaded for both siop and non-siop tokens.  to preserve existing functionality
    // make full siop validation an opt-in operation
    if(this.options.validatorOptions.performFullSiopValidation){
      validationResponse = this.validateSelfIssuedClaims(validationResponse) ;
    }
    
    return siop.validationResponse = validationResponse;
  }

  /**
   * Validate the did, sub and sub_jwk claims in the siop token
   * @param validationResponse ISiopValidationResponse instance
   * @returns ISiopValidationResponse instance
   */
  private validateSelfIssuedClaims(validationResponse: ISiopValidationResponse): ISiopValidationResponse {
    // the did claim in the token must match the did in the header
    if (!validationResponse.payloadObject.did ||
      validationResponse.payloadObject.did !== validationResponse.did) {
      return {
        result: false,
        code: errorCode(2),
        detailedError: 'The did claim is invalid',
        status: this.options.validatorOptions.invalidTokenError,
      };
    }

    // json web key from the did document
    const jwk = validationResponse.didSigningPublicKey;

    // sub_jwk claim from the token, must match jwk
    const sub_jwk = validationResponse.payloadObject.sub_jwk;

    if (!sub_jwk) {
      return {
        result: false,
        code: errorCode(3),
        detailedError: 'The sub_jwk claim is missing',
        status: this.options.validatorOptions.invalidTokenError,
      };
    }

    // we must have a sub claim to validate
    const sub = validationResponse.payloadObject.sub;

    if (!sub) {
      return {
        result: false,
        code: errorCode(4),
        detailedError: 'The sub claim is missing',
        status: this.options.validatorOptions.invalidTokenError,
      };
    }

    // the thumbprint of the did document key must match the thumbprint of the sub_jwk claim 
    // the sub_jwk claim thumbprint must match the sub claim
    const didJwkThumbprint = createJwkThumbprint(jwk);
    const subJwkThumbprint = createJwkThumbprint(sub_jwk);

    if (didJwkThumbprint !== subJwkThumbprint ||
      subJwkThumbprint !== sub) {
      return {
        result: false,
        code: errorCode(5),
        detailedError: 'The sub claim is invalid',
        status: this.options.validatorOptions.invalidTokenError,
      };
    }

    return validationResponse;
  }
}
