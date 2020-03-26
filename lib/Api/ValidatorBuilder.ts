/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenValidator, Validator, IDidResolver, ManagedHttpResolver } from '../index';
import VerifiableCredentialConstants from '../VerifiableCredential/VerifiableCredentialConstants';

/**
 * Class to build a token validator
 */
export default class ValidatorBuilder {
  private _tokenValidators: { [type: string]: TokenValidator } = {};
  private _resolver: IDidResolver  = new ManagedHttpResolver(VerifiableCredentialConstants.UNIVERSAL_RESOLVER_URL);

  /**
   * Build the validator
   */
  public build(): Validator {
    return new Validator(this.tokenValidators, this.resolver);
  }

  /**
   * Sets the token validator
   * @param validator The token validator
   * @returns The validator builder
   */
  public useValidators(validators: TokenValidator[] | TokenValidator): ValidatorBuilder {
    const validatorArray = validators as TokenValidator[];
    if (validatorArray.length) {
      for (let inx=0; inx < validatorArray.length; inx++) {
        this._tokenValidators[validatorArray[inx].isType] = validatorArray[inx]; 
      }
    } else {
      this._tokenValidators[(validators as TokenValidator).isType] = (validators as TokenValidator); 
    }

    return this;
  }

  /**
   * Gets the token validators
   */
  public get tokenValidators(): { [type: string]: TokenValidator } {
    return this._tokenValidators;
  }

  /**
   * Gets the resolver
   */
  public get resolver(): IDidResolver {
    return this._resolver;
  }
}

