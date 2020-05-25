/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { CryptoFactoryNode, JoseProtocol, KeyStoreInMemory, SubtleCryptoNode } from 'verifiablecredentials-crypto-sdk-typescript';
import { CryptoOptions, ICryptoOptions, IDidResolver } from '../index';
import IValidatorOptions from '../Options/IValidatorOptions';
import { IHttpClientOptions } from "./IValidatorOptions";

/**
 * Basic IValidatorOptions implementation
 */
export default class BasicValidatorOptions implements IValidatorOptions {

  private readonly _httpClient: IHttpClientOptions;
  private readonly _crypto: ICryptoOptions;

  constructor(private _resolver?: IDidResolver) {
    const keyStore = new KeyStoreInMemory();
    const cryptoFactory = new CryptoFactoryNode(keyStore, SubtleCryptoNode.getSubtleCrypto());
    const payloadProtectionProtocol = new JoseProtocol();
    this._httpClient = {
      options: {}
    };

    this._crypto = {
      keyStore,
      cryptoFactory,
      payloadProtectionProtocol,
      payloadProtectionOptions: new CryptoOptions(cryptoFactory, payloadProtectionProtocol).payloadProtectionOptions
    };
  }

  get resolver(): IDidResolver {
    return this._resolver!;
  }

  get httpClient(): IHttpClientOptions {
    return this._httpClient;
  }

  get crypto(): ICryptoOptions {
    return this._crypto;
  }
}