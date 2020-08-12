/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { CryptoBuilder, KeyReference, Crypto, KeyUse, LongFormDid, RequestorBuilder, IRequestorPresentationExchange, PresentationDefinitionModel } from '../lib/index';
import Credentials from './Credentials';
import { ClientSecretCredential } from '@azure/identity';
import PresentationDefinition from './models/PresentationDefinitionSample1'

describe('Sample for Requestor with different key type and using Key Vault', () =>{
    const credentials = new ClientSecretCredential(Credentials.tenantGuid, Credentials.clientId, Credentials.clientSecret);
    const keyVaultEnabled = Credentials.vaultUri.startsWith('https');
    let originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    beforeAll(async () => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;            
    });
    afterAll(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    /**
     * Generate the necessary keys. Typically the keys are generated outside of the app e.g. on the key vault portal.
     * @param crypto The crypto object
     */
    const generateKeys = async (crypto: Crypto): Promise<Crypto> => {
        crypto = await crypto.generateKey(KeyUse.Signature, 'signing');
        console.log('Signing key generated');
        crypto = await crypto.generateKey(KeyUse.Signature, 'recovery');
        console.log('recovery key generated');

        let did = await new LongFormDid(crypto).serialize();
        crypto.builder.useDid(did);
        return crypto
    }

    const createRequest = async (crypto: Crypto): Promise<string> => {

        // Create requestor
        const requestor = new RequestorBuilder(PresentationDefinition.presentationExchangeDefinition, crypto)
            .build();
        
        const request = await requestor.create();
        if (request.result) {
            expect(request.request).toBeDefined();
        } else {
            fail(`Error: ${request.detailedError}`);
        }
        return request.request!;
    }
    
    it ('should create a request signed on node', async () => {
        // Setup sample crypto objects
        const signingKeyReference = new KeyReference('neo');
        const recoveryKeyReference = new KeyReference('recovery');
        let cryptoNode = new CryptoBuilder()
            .useSigningKeyReference(signingKeyReference)
            .useRecoveryKeyReference(recoveryKeyReference)
            .build();

        //Generate the necessary keys and set the DID
        cryptoNode = await generateKeys(cryptoNode);

        // Create request
        const request = await createRequest(cryptoNode);
        console.log(`The request: ${request}`);
    });
    
    it ('should create a request signed by a key on Key Vault', async () => {

        if (!keyVaultEnabled) {
            console.log('To run this sample, you must specify your Key Vault credentials in Credentials.ts');
            return;
        }
        const signingKeyReference = new KeyReference('neo', 'key');
        const recoveryKeyReference = new KeyReference('recovery', 'key');
        let cryptoKv = new CryptoBuilder()
            .useSigningKeyReference(signingKeyReference)
            .useRecoveryKeyReference(recoveryKeyReference)
            .useKeyVault(credentials, Credentials.vaultUri)
            .build();

        //Generate the necessary keys and set the DID
        cryptoKv = await generateKeys(cryptoKv);

        // Create request
        const request = await createRequest(cryptoKv);
        console.log(`The request: ${request}`);
    });

    it ('should create a request signed by a secret on Key Vault', async () => {

        if (!keyVaultEnabled) {
            console.log('To run this sample, you must specify your Key Vault credentials in Credentials.ts');
            return;
        }
        const signingKeyReference = new KeyReference('neo', 'secret');
        const recoveryKeyReference = new KeyReference('recovery', 'secret');
        let cryptoKv = new CryptoBuilder()
            .useSigningKeyReference(signingKeyReference)
            .useRecoveryKeyReference(recoveryKeyReference)
            .useKeyVault(credentials, Credentials.vaultUri)
            .build();

        //Generate the necessary keys and set the DID
        cryptoKv = await generateKeys(cryptoKv);

        // Create request
        const request = await createRequest(cryptoKv);
        console.log(`The request: ${request}`);

    });
});

