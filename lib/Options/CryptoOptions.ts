/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IKeyStore, IPayloadProtectionOptions, IPayloadProtection, CryptoFactory } from '@microsoft/crypto-sdk';
import { TSMap } from "typescript-map";

 /**
 * Interface to model the crypto options
 */
export interface ICryptoOptions {
  /**
   * Get the key store
   */
  keyStore: IKeyStore;

  /**
   * Get the subtle crypto object
   */
  cryptoFactory: CryptoFactory;

  /** 
   * The payload protection protocol
  */
  payloadProtectionProtocol: IPayloadProtection;

  /**
   * Get the default payload protection options
   */
  payloadProtectionOptions: IPayloadProtectionOptions;
}

export default class CryptoOptions implements ICryptoOptions {

  // Get the subtle crypto object
  public keyStore: IKeyStore;

  // Get the default crypto options
  public payloadProtectionOptions: IPayloadProtectionOptions;

  /**
   * Create the CryptoOptions instance
   * @param cryptoFactory The crypto factory.
   * @param payloadProtectionProtocol The protocol used to protect payloads
   */
  constructor(public cryptoFactory: CryptoFactory, public payloadProtectionProtocol: IPayloadProtection) {
    this.keyStore = cryptoFactory.keyStore;
    this.payloadProtectionOptions = {
      cryptoFactory: this.cryptoFactory,
      options: new TSMap(),
      payloadProtection: this.payloadProtectionProtocol
    };
  }}