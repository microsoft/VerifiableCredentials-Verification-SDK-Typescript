import { CryptoBuilder } from "../lib";
import { KeyStoreInMemory, CryptoFactoryNode, JoseProtocol, SubtleCrypto, KeyStoreKeyVault, CryptoFactoryManager } from "verifiablecredentials-crypto-sdk-typescript";
import { ClientSecretCredential } from '@azure/identity';

describe('CryptoBuilder', () => {
  it('should create a CryptoBuiler', () => {
    const did = 'did:test:12345678';
    const signingKeyReference = 'test';
    const builder = new CryptoBuilder(did, signingKeyReference);
    expect(builder.keyStore instanceof KeyStoreInMemory).toBeTruthy();
    expect(builder.cryptoFactory instanceof CryptoFactoryNode).toBeTruthy();
    expect(builder.payloadProtectionProtocol instanceof JoseProtocol).toBeTruthy();
    expect(builder.subtle instanceof SubtleCrypto).toBeTruthy();
    expect(builder.payloadProtectionOptions).toBeDefined();
    expect(builder.did).toEqual(did);
  });
  
  it('should build a CryptoBuiler', () => {
    const did = 'did:test:12345678';
    const signingKeyReference = 'test';
    const builder = new CryptoBuilder(did, signingKeyReference);
    const crypto = builder.build();
    expect(crypto.builder.keyStore instanceof KeyStoreInMemory).toBeTruthy();
    expect(crypto.builder.cryptoFactory instanceof CryptoFactoryNode).toBeTruthy();
    expect(crypto.builder.payloadProtectionProtocol instanceof JoseProtocol).toBeTruthy();
    expect(crypto.builder.subtle instanceof SubtleCrypto).toBeTruthy();
    expect(crypto.builder.payloadProtectionOptions).toBeDefined();
  });
  
  it('should build a CryptoBuiler with key vault', () => {
    const did = 'did:test:12345678';
    const signingKeyReference = 'test';
    const credential = new ClientSecretCredential('tenantId', 'clientId', 'clientSecret');
    const crypto = new CryptoBuilder(did, signingKeyReference)
      .useKeyVault(credential, 'https://keyvault.com')
      .build();

    expect(crypto.builder.keyStore instanceof KeyStoreKeyVault).toBeTruthy();
    expect(crypto.builder.cryptoFactory.keyStore instanceof KeyStoreKeyVault).toBeTruthy();
    expect(crypto.builder.payloadProtectionProtocol instanceof JoseProtocol).toBeTruthy();
    expect(crypto.builder.subtle instanceof SubtleCrypto).toBeTruthy();
    expect(crypto.builder.payloadProtectionOptions).toBeDefined();
  });
});