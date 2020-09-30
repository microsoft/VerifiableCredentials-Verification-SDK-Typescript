/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IExpectedSiop } from '../index';

/**
 * Class to model the Linked Data crypto suites public keys
 * Suites: https://w3c-ccg.github.io/ld-cryptosuite-registry/
 */
export class LinkedDataCryptoSuitePublicKey {
  /**
   * Set of supported suites
   */
  public static suites: { [suite: string]: any } = {
    Ed25519VerificationKey2018: (rawPublicKey: any): object => {
      if (!rawPublicKey) {
        throw new Error('Pass in the public key. Undefined.');
      }

      if (!rawPublicKey.publicKeyBase58) {
        throw new Error('publicKeyBase58 not defined in the public key.');
      }

      return {
        kty: 'OKP',
        use: 'sig',
        alg: 'EdDSA'
        x: LinkedDataCryptoSuitePublicKey.decodeBase58To64Url(rawPublicKey.publicKeyBase58)
      }
    }
  };

  public static create(rawPublicKey: object): LinkedDataCryptoSuitePublicKey {
  }

  constructor(private _rawPublicKey){
  }

  public get rawPublicKey(): object {
    return this._rawPublicKey;
  }

  private static decodeBase58To64Url(data: string): string {
    return data;
  }
}