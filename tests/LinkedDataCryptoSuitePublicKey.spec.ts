/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import LinkedDataCryptoSuitePublicKey from '../lib/input_validation/LinkedDataCryptoSuitePublicKey';
import base64url from 'base64url';

describe('LinkedDataCryptoSuitePublicKey', () => {
  it('should return a Ed25519VerificationKey2018 public key', () => {
    let didDocumentPublicKey: any = {
      "@context": ["https://w3id.org/security/v1"],
      "id": "did:example:123456789abcdefghi#keys-1",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:example:123456789abcdefghi",
      "expires": "2017-02-08T16:02:20Z",
      "publicKeyBase58": "H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
    };

    let jwk = LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey);
    expect(jwk).toBeDefined();
    expect(jwk.alg).toEqual('EdDSA');
    expect(jwk.crv).toEqual('ed25519');
    expect(jwk.kty).toEqual('OKP');
    expect(jwk.use).toEqual('sig');
    expect(jwk.x).toEqual('7kqc5NnojHJHZ11Ec5cGCLMIKgJVDBKhrAbu9YrfVFg');

    didDocumentPublicKey = {
      "@context": ["https://w3id.org/security/v1"],
      "id": "did:example:123456789abcdefghi#keys-1",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:example:123456789abcdefghi",
      "expires": "2017-02-08T16:02:20Z",
      "publicKeyJwk": {
        "kty": "OKP",
        "alg": "EdDSA",
        "kid": "#test-key",
        "crv": "ed25519",
        "x": "yOrwnHVTKn3UO2K29ctcOTXo0hZmm7njlFR_uPC8aBc",
        "use": "verify"
      }
    };
    jwk = LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey);
    expect(jwk.x).toEqual('yOrwnHVTKn3UO2K29ctcOTXo0hZmm7njlFR_uPC8aBc');

    didDocumentPublicKey = {
      "@context": ["https://w3id.org/security/v1"],
      "id": "did:example:123456789abcdefghi#keys-1",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:example:123456789abcdefghi",
      "expires": "2017-02-08T16:02:20Z",
      "publicKeyHex": "1122334455"
    };
    jwk = LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey);
    expect(jwk.x).toEqual(base64url.encode(Buffer.from('1122334455', 'hex')));

    // Negative cases
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(<any>undefined)).toThrowError('The passed in public key is not defined');

    didDocumentPublicKey = {
      "@context": ["https://w3id.org/security/v1"],
      "id": "did:example:123456789abcdefghi#keys-1",
      "controller": "did:example:123456789abcdefghi",
      "expires": "2017-02-08T16:02:20Z",
      "publicKeyHex": "1122334455"
    };
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey)).toThrowError(`The passed in public key has no type. {"@context":["https://w3id.org/security/v1"],"id":"did:example:123456789abcdefghi#keys-1","controller":"did:example:123456789abcdefghi","expires":"2017-02-08T16:02:20Z","publicKeyHex":"1122334455"}`);
    expect(() => LinkedDataCryptoSuitePublicKey.parsePublicKey(<any>undefined)).toThrowError(`Pass in the public key. Undefined.`);
    didDocumentPublicKey = {
      "xxx": "1122334455"
    };
    expect(() => LinkedDataCryptoSuitePublicKey.parsePublicKey(didDocumentPublicKey)).toThrowError(`{"xxx":"1122334455"} public key type is not supported.`);

    didDocumentPublicKey = {
      "@context": ["https://w3id.org/security/v1"],
      "id": "did:example:123456789abcdefghi#keys-1",
      "type": "xxx",
      "controller": "did:example:123456789abcdefghi",
      "expires": "2017-02-08T16:02:20Z",
      "publicKeyBase58": "H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
    };
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey)).toThrowError(`The suite with type: 'xxx' is not supported.`);

    const testSpy = {
      "type": "Ed25519VerificationKey2018",
      "publicKeyJwk": {}
    };
    const parsePublicKeySpy: jasmine.Spy = spyOn(LinkedDataCryptoSuitePublicKey, 'parsePublicKey').withArgs(testSpy);
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(<any>testSpy)).toThrowError(`{"type":"Ed25519VerificationKey2018","publicKeyJwk":{}} public key type is not supported.`);
  });
  it('should return a Secp256k1VerificationKey2018 public key', () => {
    let didDocumentPublicKey: any = {
      "id": "#test-key",
      "type": "Secp256k1VerificationKey2018",
      "publicKeyJwk": {
        "kty": "EC",
        "alg": "ES256K",
        "kid": "#test-key",
        "crv": "secp256k1",
        "x": "yOrwnHVTKn3UO2K29ctcOTXo0hZmm7njlFR_uPC8aBc",
        "y": "05fsHpcimSDwdnQ_sKw5tmsNMx_3WRBDibpydraxLwA",
        "use": "verify",
        "defaultEncryptionAlgorithm": "none"
      }
    };

    let jwk = LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey);
    expect(jwk).toBeDefined();
    expect(jwk.alg).toEqual('ES256K');
    expect(jwk.crv).toEqual('secp256k1');
    expect(jwk.kty).toEqual('EC');
    expect(jwk.use).toEqual('verify');
    expect(jwk.x).toEqual('yOrwnHVTKn3UO2K29ctcOTXo0hZmm7njlFR_uPC8aBc');
    expect(jwk.y).toEqual('05fsHpcimSDwdnQ_sKw5tmsNMx_3WRBDibpydraxLwA');
    
    // Negative cases
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(<any>undefined)).toThrowError('The passed in public key is not defined');
    didDocumentPublicKey = {
      "id": "#test-key",
      "type": "xxx",
      "publicKeyJwk": {
        "kty": "EC",
        "alg": "ES256K",
        "kid": "#test-key",
        "crv": "secp256k1",
        "x": "yOrwnHVTKn3UO2K29ctcOTXo0hZmm7njlFR_uPC8aBc",
        "y": "05fsHpcimSDwdnQ_sKw5tmsNMx_3WRBDibpydraxLwA",
        "use": "verify",
        "defaultEncryptionAlgorithm": "none"
      }
    };
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey)).toThrowError(`The suite with type: 'xxx' is not supported.`);

    didDocumentPublicKey = {
      "id": "#test-key",
      "type": "Secp256k1VerificationKey2018",
      "publicKeyBase58": "AAAAA"
    };
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey)).toThrowError(`{"id":"#test-key","type":"Secp256k1VerificationKey2018","publicKeyBase58":"AAAAA"} public key type is not supported.`);
    
    const testSpy = {
      "type": "Secp256k1VerificationKey2018",
      "publicKeyJwk": {}
    };
    const parsePublicKeySpy: jasmine.Spy = spyOn(LinkedDataCryptoSuitePublicKey, 'parsePublicKey').withArgs(testSpy);
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(<any>testSpy)).toThrowError(`{"type":"Secp256k1VerificationKey2018","publicKeyJwk":{}} public key type is not supported.`);
  });
  it('should return a EcdsaSecp256k1VerificationKey2019 public key', () => {
    let didDocumentPublicKey: any = {
      "id": "#test-key",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "publicKeyJwk": {
        "kty": "EC",
        "alg": "ES256K",
        "kid": "#test-key",
        "crv": "secp256k1",
        "x": "yOrwnHVTKn3UO2K29ctcOTXo0hZmm7njlFR_uPC8aBc",
        "y": "05fsHpcimSDwdnQ_sKw5tmsNMx_3WRBDibpydraxLwA",
        "use": "verify",
        "defaultEncryptionAlgorithm": "none"
      }
    };

    let jwk = LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey);
    expect(jwk).toBeDefined();
    expect(jwk.alg).toEqual('ES256K');
    expect(jwk.crv).toEqual('secp256k1');
    expect(jwk.kty).toEqual('EC');
    expect(jwk.use).toEqual('verify');
    expect(jwk.x).toEqual('yOrwnHVTKn3UO2K29ctcOTXo0hZmm7njlFR_uPC8aBc');
    expect(jwk.y).toEqual('05fsHpcimSDwdnQ_sKw5tmsNMx_3WRBDibpydraxLwA');

    // Negative cases
    didDocumentPublicKey = {
      "id": "#test-key",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "publicKeyBase58": "AAAAA"
    };

    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey)).toThrowError(`{"id":"#test-key","type":"EcdsaSecp256k1VerificationKey2019","publicKeyBase58":"AAAAA"} public key type is not supported.`);
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(<any>undefined)).toThrowError('The passed in public key is not defined');
    didDocumentPublicKey = {
      "id": "#test-key",
      "type": "xxx",
      "publicKeyJwk": {
        "kty": "EC",
        "alg": "ES256K",
        "kid": "#test-key",
        "crv": "secp256k1",
        "x": "yOrwnHVTKn3UO2K29ctcOTXo0hZmm7njlFR_uPC8aBc",
        "y": "05fsHpcimSDwdnQ_sKw5tmsNMx_3WRBDibpydraxLwA",
        "use": "verify",
        "defaultEncryptionAlgorithm": "none"
      }
    };
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey)).toThrowError(`The suite with type: 'xxx' is not supported.`);

    didDocumentPublicKey = {
      "id": "#test-key",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "publicKeyBase58": "AAAAA"
    };
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey)).toThrowError(`{"id":"#test-key","type":"EcdsaSecp256k1VerificationKey2019","publicKeyBase58":"AAAAA"} public key type is not supported.`);

    const testSpy = {
      "type": "EcdsaSecp256k1VerificationKey2019",
      "publicKeyJwk": {}
    };
    const parsePublicKeySpy: jasmine.Spy = spyOn(LinkedDataCryptoSuitePublicKey, 'parsePublicKey').withArgs(testSpy);
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(<any>testSpy)).toThrowError(`{"type":"EcdsaSecp256k1VerificationKey2019","publicKeyJwk":{}} public key type is not supported.`);
  });
  it('should return a RsaVerificationKey2018 public key', () => {
    let didDocumentPublicKey: any = {
      "id": "#test-key",
      "type": "RsaVerificationKey2018",
      "publicKeyJwk": {
        "kty": "RSA",
        "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx",
        "e": "AQAB",
        "alg": "RS256",
        "use": "sig"
      }
    };

    const jwk = LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey);
    expect(jwk).toBeDefined();
    expect(jwk.alg).toEqual('RS256');
    expect(jwk.kty).toEqual('RSA');
    expect(jwk.use).toEqual('sig');
    expect(jwk.e).toEqual('AQAB');
    expect(jwk.n).toEqual('0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx');
    
    // Negative cases
    didDocumentPublicKey = {
      "id": "#test-key",
      "type": "RsaVerificationKey2018",
      "publicKeyBase58": "AAAAA"
    };
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey)).toThrowError(`{"id":"#test-key","type":"RsaVerificationKey2018","publicKeyBase58":"AAAAA"} public key type is not supported.`);
    
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(<any>undefined)).toThrowError('The passed in public key is not defined');
    didDocumentPublicKey = {
      "id": "#test-key",
      "type": "xxx",
      "publicKeyJwk": {
        "kty": "RSA",
        "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx",
        "e": "AQAB",
        "alg": "RS256",
        "use": "sig"
      }
    };
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey)).toThrowError(`The suite with type: 'xxx' is not supported.`);    
    
    const testSpy = {
      "type": "RsaVerificationKey2018",
      "publicKeyJwk": {}
    };
    const parsePublicKeySpy: jasmine.Spy = spyOn(LinkedDataCryptoSuitePublicKey, 'parsePublicKey').withArgs(testSpy);
    expect(() => LinkedDataCryptoSuitePublicKey.getPublicKey(<any>testSpy)).toThrowError(`{"type":"RsaVerificationKey2018","publicKeyJwk":{}} public key type is not supported.`);
  });

});