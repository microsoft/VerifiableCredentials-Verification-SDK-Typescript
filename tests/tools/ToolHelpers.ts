import { KeyStoreInMemory, CryptoFactoryNode, SubtleCryptoNode, JoseProtocol } from 'verifiablecredentials-crypto-sdk-typescript';
import { IValidationOptions, ValidationOptions, ManagedHttpResolver, CryptoOptions, TokenType } from '../../lib';

export default class ToolHelpers {
  public static getOptions(): IValidationOptions {
    const keyStore = new KeyStoreInMemory();
    const cryptoFactory =  new CryptoFactoryNode(keyStore, SubtleCryptoNode.getSubtleCrypto());
    const options = new ValidationOptions(
      {
        resolver: new ManagedHttpResolver('https://dev.discover.did.msidentity.com'),
        httpClient: require('isomorphic-fetch'),
        crypto: {
          keyStore,
          cryptoFactory,
          payloadProtectionProtocol: new JoseProtocol(),
          payloadProtectionOptions: new CryptoOptions(cryptoFactory, new JoseProtocol()).payloadProtectionOptions
        }
      }, TokenType.idToken);
      return options;
  }
}