/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import base64url from 'base64url';
const bs58 = require('bs58')

/**
 * Class to model the Linked Data crypto suites public keys
 * Suites: https://w3c-ccg.github.io/ld-cryptosuite-registry/
 */
export default class LinkedDataCryptoSuitePublicKey {
  /**
   * Set of supported suites
   */
  public static suites: { [suite: string]: any } = {
    WorkEd25519VerificationKey2020: (rawPublicKey: any): object => {
      let publicKey = LinkedDataCryptoSuitePublicKey.parsePublicKey(rawPublicKey);
      if (!publicKey) {
        throw new Error(`${JSON.stringify(rawPublicKey)} public key type is not supported.`);
      }

      if (typeof publicKey === 'string') {
        return {
          kty: 'OKP',
          use: 'sig',
          alg: 'EdDSA',
          crv: 'ed25519',
          x: publicKey
        };
      }

      return publicKey;
    },
    Ed25519VerificationKey2018: (rawPublicKey: any): object => {
      let publicKey = LinkedDataCryptoSuitePublicKey.parsePublicKey(rawPublicKey);
      if (!publicKey) {
        throw new Error(`${JSON.stringify(rawPublicKey)} public key type is not supported.`);
      }

      if (typeof publicKey === 'string') {
        return {
          kty: 'OKP',
          use: 'sig',
          alg: 'EdDSA',
          crv: 'ed25519',
          x: publicKey
        };
      }

      return publicKey;
    },
    Secp256k1VerificationKey2018: (rawPublicKey: any): object => {
      let publicKey = LinkedDataCryptoSuitePublicKey.parsePublicKey(rawPublicKey);
      if (!publicKey) {
        throw new Error(`${JSON.stringify(rawPublicKey)} public key type is not supported.`);
      }

      if (typeof publicKey === 'string') {
        throw new Error(`${JSON.stringify(rawPublicKey)} public key type is not supported.`);
      }

      return publicKey;
    },
    EcdsaSecp256k1VerificationKey2019: (rawPublicKey: any): object => {
      let publicKey = LinkedDataCryptoSuitePublicKey.parsePublicKey(rawPublicKey);
      if (!publicKey) {
        throw new Error(`${JSON.stringify(rawPublicKey)} public key type is not supported.`);
      }

      if (typeof publicKey === 'string') {
        throw new Error(`${JSON.stringify(rawPublicKey)} public key type is not supported.`);
      }

      return publicKey;
    },
    RsaVerificationKey2018: (rawPublicKey: any): object => {
      let publicKey = LinkedDataCryptoSuitePublicKey.parsePublicKey(rawPublicKey);
      if (!publicKey) {
        throw new Error(`${JSON.stringify(rawPublicKey)} public key type is not supported.`);
      }

      if (typeof publicKey === 'string') {
        throw new Error(`${JSON.stringify(rawPublicKey)} public key type is not supported.`);
      }

      return publicKey;
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

  public static parsePublicKey(rawPublicKey: any): any {
    if (!rawPublicKey) {
      throw new Error('Pass in the public key. Undefined.');
    }

    let publicKey: any;
    if (rawPublicKey.publicKeyJwk) {
      return rawPublicKey.publicKeyJwk;
    } else if (rawPublicKey.publicKeyBase58) {
      publicKey = LinkedDataCryptoSuitePublicKey.decodeBase58To64Url(rawPublicKey.publicKeyBase58);
    } else if (rawPublicKey.publicKeyHex) {
      publicKey = base64url.encode(Buffer.from((rawPublicKey.publicKeyHex), 'hex'));
    }
    if (!publicKey) {
      throw new Error(`${JSON.stringify(rawPublicKey)} public key type is not supported.`);
    }

    return publicKey;
  }

  /**
   * Convert base58 to base64 url.
   * @param data to convert.
   */
  public static decodeBase58To64Url(data: string): string {
    return base64url.encode(bs58.decode(data));
  }
}