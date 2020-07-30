/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Crypto, IDidResolver, CryptoBuilder } from '../index';
import IValidatorOptions from '../Options/IValidatorOptions';
import { IHttpClientOptions } from "./IValidatorOptions";

/**
 * Basic IValidatorOptions implementation
 */
export default class BasicValidatorOptions implements IValidatorOptions {

  private readonly _httpClient: IHttpClientOptions;
  private readonly _crypto: Crypto;

  constructor(private _resolver?: IDidResolver) {
    this._httpClient = {
      options: {}
    };

    this._crypto = new CryptoBuilder().build();
  }

  get resolver(): IDidResolver {
    return this._resolver!;
  }

  get httpClient(): IHttpClientOptions {
    return this._httpClient;
  }

  get crypto(): Crypto {
    return this._crypto;
  }
}