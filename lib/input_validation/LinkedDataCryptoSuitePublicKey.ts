/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IExpectedSiop } from '../index';

/**
 * Class to model the Linked Data crypto suites public keys
 * Suites: https://w3c-ccg.github.io/ld-cryptosuite-registry/
 */
export default class LinkedDataCryptoSuitePublicKey {
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
        alg: 'EdDSA',
        crv: 'ed25519',
        x: LinkedDataCryptoSuitePublicKey.decodeBase58To64Url(rawPublicKey.publicKeyBase58)
      }
    },
    Secp256k1VerificationKey2018: (rawPublicKey: any): object => {
      if (!rawPublicKey) {
        throw new Error('Pass in the public key. Undefined.');
      }

      if (!rawPublicKey.publicKeyJwk) {
        throw new Error('publicKeyJwk not defined in the public key.');
      }

      return rawPublicKey.publicKeyJwk;
    }
  };


  /**
   * Return a normalized public key from the DID document.
   * @param rawPublicKey Public key object from the DID document
   */
  public static getPublicKey(rawPublicKey: any): any {
    if (!rawPublicKey) {
      throw new Error(`The passed in public key is not defined`);
    }

    const suiteType = rawPublicKey.type;
    if (!suiteType) {
      throw new Error(`The passed in public key has no type. ${JSON.stringify(rawPublicKey)}`);
    }

    const suite = LinkedDataCryptoSuitePublicKey.suites[suiteType];
    if (!suite) {
      throw new Error(`The suite with type: '${suiteType}' is not supported.`);
    }

    return suite(rawPublicKey);
  }

  /**
   * Convert base58 to base64 url.
   * @param data to convert.
   */
  private static decodeBase58To64Url(data: string): string {
    return data;
  }
}