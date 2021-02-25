/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import base64url from 'base64url';
import ErrorHelpers from '../error_handling/ErrorHelpers';
import ValidationError from '../error_handling/ValidationError';
const bs58 = require('bs58');
const errorCode = (error: number) => ErrorHelpers.errorCode('VCSDKLDCS', error);

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
        throw new ValidationError(`${JSON.stringify(rawPublicKey)} public key type is not supported.`, errorCode(1));
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
        throw new ValidationError(`${JSON.stringify(rawPublicKey)} public key type is not supported.`, errorCode(3));
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
        throw new ValidationError(`${JSON.stringify(rawPublicKey)} public key type is not supported.`, errorCode(5));
      }

      if (typeof publicKey === 'string') {
        throw new ValidationError(`${JSON.stringify(rawPublicKey)} public key type is not supported.`, errorCode(4));
      }

      return publicKey;
    },
    EcdsaSecp256k1VerificationKey2019: (rawPublicKey: any): object => {
      let publicKey = LinkedDataCryptoSuitePublicKey.parsePublicKey(rawPublicKey);
      if (!publicKey) {
        throw new ValidationError(`${JSON.stringify(rawPublicKey)} public key type is not supported.`, errorCode(7));
      }

      if (typeof publicKey === 'string') {
        throw new ValidationError(`${JSON.stringify(rawPublicKey)} public key type is not supported.`, errorCode(6));
      }

      return publicKey;
    },
    RsaVerificationKey2018: (rawPublicKey: any): object => {
      let publicKey = LinkedDataCryptoSuitePublicKey.parsePublicKey(rawPublicKey);
      if (!publicKey) {
        throw new ValidationError(`${JSON.stringify(rawPublicKey)} public key type is not supported.`, errorCode(9));
      }

      if (typeof publicKey === 'string') {
        throw new ValidationError(`${JSON.stringify(rawPublicKey)} public key type is not supported.`, errorCode(8));
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
      throw new ValidationError(`The passed in public key is not defined`, errorCode(10));
    }

    const suiteType = rawPublicKey.type;
    if (!suiteType) {
      throw new ValidationError(`The passed in public key has no type. ${JSON.stringify(rawPublicKey)}`, errorCode(11));
    }

    const suite = LinkedDataCryptoSuitePublicKey.suites[suiteType];
    if (!suite) {
      throw new ValidationError(`The suite with type: '${suiteType}' is not supported.`, errorCode(12));
    }

    return suite(rawPublicKey);
  }

  public static parsePublicKey(rawPublicKey: any): any {
    if (!rawPublicKey) {
      throw new ValidationError(`Pass in the public key. Undefined.`, errorCode(13));
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
      throw new ValidationError(`${JSON.stringify(rawPublicKey)} public key type is not supported.`, errorCode(2));
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