/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITokenValidator, Validator, IDidResolver, ManagedHttpResolver } from '../index';
import VerifiableCredentialConstants from '../VerifiableCredential/VerifiableCredentialConstants';
import { Crypto } from '../index';

/**
 * Class to build a token validator
 */
export default class ValidatorBuilder {
  private _tokenValidators: { [type: string]: ITokenValidator } = {};
  private _resolver: IDidResolver  = new ManagedHttpResolver(VerifiableCredentialConstants.UNIVERSAL_RESOLVER_URL);

  constructor(private _crypto: Crypto) {

  }

  /**
   * Gets the crypto object
   */
  public get crypto() {
    return this._crypto;
  }

  /**
   * Build the validator
   */
  public build(): Validator {
    return new Validator(this);
  }

  /**
   * Sets the token validator
   * @param validator The token validator
   * @returns The validator builder
   */
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

  /**
   * Gets the token validators
   */
  public get tokenValidators(): { [type: string]: ITokenValidator } {
    return this._tokenValidators;
  }

  /**
   * Gets the resolver
   */
  public get resolver(): IDidResolver {
    return this._resolver;
  }
}

