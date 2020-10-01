/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { LinkedDataCryptoSuitePublicKey } from '../lib/index';

describe('LinkedDataCryptoSuitePublicKey', () => {
  it('should return a Ed25519VerificationKey2018 public key', ()=> {
    const didDocumentPublicKey = {
      "@context": ["https://w3id.org/security/v1"],
      "id": "did:example:123456789abcdefghi#keys-1",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:example:123456789abcdefghi",
      "expires": "2017-02-08T16:02:20Z",
      "publicKeyBase58" : "H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
    };

    const jwk = LinkedDataCryptoSuitePublicKey.getPublicKey(didDocumentPublicKey);
    expect(jwk).toBeDefined();
    expect(jwk.alg).toEqual('EdDSA');
    expect(jwk.crv).toEqual('ed25519');
    expect(jwk.kty).toEqual('OKP');
    expect(jwk.use).toEqual('sig');
    expect(jwk.x).toEqual('H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV');    
  })
});