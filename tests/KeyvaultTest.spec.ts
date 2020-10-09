/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import Credentials from './Credentials';
import { ClientSecretCredential } from '@azure/identity';
import { CryptoBuilder, JoseBuilder, KeyReference } from '../lib';

describe('Sample for Requestor with different key type and using Key Vault', () =>{
  const credentials = new ClientSecretCredential(Credentials.tenantGuid, Credentials.clientId, Credentials.clientSecret);
  const keyVaultEnabled = Credentials.vaultUri.startsWith('https');
  if(keyVaultEnabled) {
    console.log('To run this sample, you must specify your Key Vault credentials in Credentials.ts');
    return;
  }
  let originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  beforeAll(async () => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;            
  });
  afterAll(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it('should sign on key vault', async () => {
    const kvSigningKey = 'EC-Key-for-testing-remote-reference';
    const kvRecoveryKey = 'EC-Key-for-testing-remote-reference-recovery';
    const signingKeyReference = new KeyReference(kvSigningKey);
    const recoveryKeyReference = new KeyReference(kvRecoveryKey);
    let cryptoKv = new CryptoBuilder()
        .useSigningKeyReference(signingKeyReference)
        .useRecoveryKeyReference(recoveryKeyReference)
        .useKeyVault(credentials, Credentials.vaultUri)
        .build();

    // Create request
    const payload = {
      purpose: 'payload to sign',
      action: 'make key vault swing'
    };

    const jose = new JoseBuilder(cryptoKv).build();
    //jose = await jose
  });

});
