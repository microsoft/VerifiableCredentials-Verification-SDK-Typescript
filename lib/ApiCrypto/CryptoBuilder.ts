import { Crypto, SubtleCrypto } from '../index';
import { IKeyStore, CryptoFactory, KeyStoreFactory, CryptoFactoryManager, SubtleCryptoNode, IPayloadProtection, IPayloadProtectionOptions, JoseProtocol, JoseConstants, KeyStoreInMemory } from 'verifiablecredentials-crypto-sdk-typescript';
import { TSMap } from 'typescript-map';
import { TokenCredential } from '@azure/identity';

export default class CryptoBuilder {
  // Set the default state
  private _keyStore: IKeyStore = new KeyStoreInMemory();
  private _subtle: SubtleCrypto = new SubtleCryptoNode().getSubtleCrypto();
  private _cryptoFactory: CryptoFactory = CryptoFactoryManager.create(
    'CryptoFactoryNode',
    this.keyStore,
    this.subtle);
  
  private _payloadProtectionProtocol: IPayloadProtection = new JoseProtocol();
  private _payloadProtectionOptions: IPayloadProtectionOptions  =  {
    cryptoFactory: this.cryptoFactory,
    options: new TSMap(),
    payloadProtection: this.payloadProtectionProtocol
  };
  private protectedHeader = new TSMap();

  /**
   * Create a crypto builder to provide crypto capabilities
   * @param didKid of the requestor's signing key
   * @param signingKeyReference Reference in the key store to the signing key
   */
  constructor(private _did: string, private _signingKeyReference: string) {
  }
  
  /**
   * Get the DID of the requestor
   */
  public get did() {
    return this._did;
  }
  
  /**
   * Set the DID of the requestor
   */
  public set did(did: string) {
    this._did = did;

     // Set the protected header
     this.protectedHeader.set('kid', `${this._did}#${this._signingKeyReference}`);
     this.protectedHeader.set('typ', 'JWT');
     this._payloadProtectionOptions.options.set(JoseConstants.optionProtectedHeader, this.protectedHeader);
  }

  /**
   * Get the reference in the key store to the signing key
   */
  public get signingKeyReference() {
    return this._signingKeyReference;
  }

  /**
   * Gets the kid for the signing key
   */
  public get signingKeyKid() {
    return `${this.did}#${this._signingKeyReference}`;
  }

  /**
   * Set the reference in the key store to the signing key
   */
  public set signingKeyReference(signingKeyReference: string) {
    this._signingKeyReference = signingKeyReference;

     // Set the protected header
     this.protectedHeader.set('kid', `${this._did}#${this._signingKeyReference}`);
     this.protectedHeader.set('typ', 'JWT');
     this._payloadProtectionOptions.options.set(JoseConstants.optionProtectedHeader, this.protectedHeader);
  }

  /**
   * Gets the key store
   */
  public get keyStore(): IKeyStore {
    return this._keyStore;
  }

  /**
   * Gets the crypto factory
   */
  public get cryptoFactory(): CryptoFactory {
    return this._cryptoFactory;
  }

  /**
   * Sets the crypto factory
   */
  public useCryptoFactory(value: CryptoFactory) {
    this._cryptoFactory = value;
    this._payloadProtectionOptions.cryptoFactory = value;
    return this;
  }

  /**
   * Gets the W3C subtle crypto web API
   */
  public get subtle(): SubtleCrypto {
    return this._subtle;
  }

  /**
   * Gets the payload protect protocol
   */
  public get payloadProtectionProtocol(): IPayloadProtection {
    return this._payloadProtectionProtocol;
  }

  /**
   * Gets the options for the payload protect protocol
   */
  public get payloadProtectionOptions(): IPayloadProtectionOptions {
    return this._payloadProtectionOptions;
  }

  /**
   * Build the crypto object
   */
  public build(): Crypto {
    return new Crypto(this);
  }

  /**
   * Use Key Vault as keystore and crypto factory
   * @param tenantGuid Guid for the tenant
   * @param clientId Client id to access Key Vault
   * @param clientSecret Client secret to access Key Vault
   * @param vaultUri Vault uri
   */
  public useKeyVault(
    credential: TokenCredential,
    vaultUri: string
  ): CryptoBuilder {
    

    this._keyStore = KeyStoreFactory.create('KeyStoreKeyVault', credential, vaultUri);
      this._subtle = new SubtleCryptoNode().getSubtleCrypto();
      this._cryptoFactory = CryptoFactoryManager.create(
        'CryptoFactoryKeyVault',
        this.keyStore!,
        this.subtle!);
    this._payloadProtectionOptions = {
      cryptoFactory: this.cryptoFactory!,
      payloadProtection: this.payloadProtectionProtocol,
      options: this.payloadProtectionOptions.options
    };
    
    //this._payloadProtectionOptions.options.set(JoseConstants.optionProtectedHeader, new TSMap([['kid', `${this.did}`]]));

    return this;
  }
}