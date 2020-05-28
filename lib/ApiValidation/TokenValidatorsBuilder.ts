/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITokenValidator, Validator, IDidResolver, ManagedHttpResolver, VerifiablePresentationTokenValidator, VerifiableCredentialTokenValidator, IdTokenTokenValidator, SiopTokenValidator, SelfIssuedTokenValidator } from '../index';

/**
 * Class to build the token validators for the different tokens
 */
export default class TokenValidatorsBuilder {
  private _tokenValidators: { [type: string]: ITokenValidator } = {};
  private vpValidator: VerifiablePresentationTokenValidator | undefined;
  private vcValidator: VerifiableCredentialTokenValidator | undefined;
  private idTokenValidator: IdTokenTokenValidator | undefined;
  private siopValidator: SiopTokenValidator | undefined;
  private siValidator: SelfIssuedTokenValidator | undefined;

  /**
   * Build the validators
   */
  public build(): { [type: string]: ITokenValidator } {
  }

  
  public useTrustIssuersForVerifiableCredentials() {

  }


  /**
   * Sets the token validator
   * @param validator The token validator
   * @returns The validator builder
   *
  
 public useValidators(validators: ITokenValidator[] | ITokenValidator): ValidatorBuilder {
    const validatorArray = validators as ITokenValidator[];
    if (validatorArray.length) {
      for (let inx=0; inx < validatorArray.length; inx++) {
        this._tokenValidators[validatorArray[inx].isType] = validatorArray[inx]; 
      }
    } else {
      this._tokenValidators[(validators as ITokenValidator).isType] = (validators as ITokenValidator); 
    }

    return this;
  }
***/
  /**
   * Gets the token validators
   */
  public get tokenValidators(): { [type: string]: ITokenValidator } {
    return this._tokenValidators;
  }
}

