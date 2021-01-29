/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Crypto, IDidResolver, CryptoBuilder, IFetchRequest, FetchRequest } from '../index';
import IValidatorOptions from './IValidatorOptions';
import { IHttpClientOptions } from "./IValidatorOptions";

/**
 * Basic IValidatorOptions implementation
 */
export default class BasicValidatorOptions implements IValidatorOptions {

  private readonly _crypto: Crypto;
  private readonly _fetchRequest: IFetchRequest;

  constructor(private _resolver?: IDidResolver) {
    this._crypto = new CryptoBuilder().build();
    this._fetchRequest = new FetchRequest();
  }

  get resolver(): IDidResolver {
    return this._resolver!;
  }

    /**
     * The fetch client
     */
  get fetchRequest(): IFetchRequest {
    return this._fetchRequest;
  }

  get crypto(): Crypto {
    return this._crypto;
  }
}