/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CryptoBuilder, KeyReference, LongFormDid, KeyUse, ClaimToken, DidDocument, TokenType } from '../lib/index';
import RequestorHelper from './RequestorHelper';
import { KeyStoreOptions, JsonWebKey, Crypto } from 'verifiablecredentials-crypto-sdk-typescript';
import ResponderHelper from './ResponderHelper';
import ITestModel from './models/ITestModel';


export default class TokenGenerator {
    constructor(public responder: ResponderHelper) {
    }


    /**
     * Http mock
     */
    public static fetchMock = require('fetch-mock');

    /**
     * Resolver url
     */
    public static resolverUrl = `https://portableidentitycards.azure-api.net/1.0/identifiers`;

    public vcSchema = this.responder.requestor.schema;

    public static configKeysCounter = 1;

    public signingKeyReference = new KeyReference('signingTokenGeneration');

    public crypto = new CryptoBuilder()
        .useSigningKeyReference(this.signingKeyReference)
        .useRecoveryKeyReference(new KeyReference('recovery'))
        .build();

    public async setup(): Promise<void> {
        this.crypto = await this.crypto.generateKey(KeyUse.Signature, 'signing');
        this.crypto = await this.crypto.generateKey(KeyUse.Signature, 'recovery');
        let did = await new LongFormDid(this.crypto).serialize();
        this.crypto.builder.useDid(did);

        // setup mock to resolve this did
        TokenGenerator.mockResolver(this.crypto);
    }

    /**
     * Mock the resolver
     */
    public static async mockResolver(crypto: Crypto) {
        const jwk = await (await crypto.builder.keyStore.get(crypto.builder.signingKeyReference!, new KeyStoreOptions({ publicKeyOnly: true }))).getKey<JsonWebKey>();
        jwk.kid = `${crypto.builder.did!}#${crypto.builder.signingKeyReference?.keyReference}`;
        const didDocument = {
            didDocument: new DidDocument({
                "@context": "https://w3id.org/did/v1",
                id: crypto.builder.did!,
                publicKey: <any>[{
                    id: jwk.kid,
                    type: 'EcdsaSecp256k1VerificationKey2019',
                    controller: crypto.builder.did!,
                    publicKeyJwk: jwk
                }]
            })
        };
        (didDocument.didDocument as any)['@context'] = 'https://w3id.org/did/v1';

        // Resolver mock
        const resolverUrl = `${TokenGenerator.resolverUrl}/${crypto.builder.did!}`;
        TokenGenerator.fetchMock.get(resolverUrl, didDocument, { overwriteRoutes: true });
        console.log(`Set mock for ${resolverUrl}`);
    }

    /**
     * Mock the configuration
     */
    public static async mockConfiguration(crypto: Crypto, configuration: string) {
        const jwks = await (await crypto.builder.keyStore.get(crypto.builder.signingKeyReference!, new KeyStoreOptions({ publicKeyOnly: true })));
        const jwksUrl = `https://jwks.example.com/${TokenGenerator.configKeysCounter++}`
        TokenGenerator.fetchMock.get(configuration, { "jwks_uri": `${jwksUrl}`, "issuer": `${crypto.builder.did!}` }, { overwriteRoutes: true });
        const serialized = JSON.stringify(jwks);
        TokenGenerator.fetchMock.get(jwksUrl, serialized, { overwriteRoutes: true });
        console.log(`Set mock for ${configuration}`);
    }

    public async setIdTokens(): Promise<void> {
        const idTokens = (<ITestModel>this.responder.responseDefinition).getIdTokensFromModel();
        if (idTokens) {
            for (let configuration in idTokens) {
                const payload: any = idTokens[configuration];

                TokenGenerator.mockConfiguration(this.crypto, configuration);

                // Additional props
                payload.sub = `${this.responder.crypto.builder.did}`;
                payload.iss = `${this.crypto.builder.did}`;

                // Sign
                await this.crypto.signingProtocol.sign(Buffer.from(JSON.stringify(payload)));
                idTokens[configuration] = await this.crypto.signingProtocol.serialize();
            }
        }
    }


    public async getVC(vcPayload: any): Promise<ClaimToken> {

        // Additional props
        vcPayload.sub = `${this.responder.crypto.builder.did}`;
        vcPayload.iss = `${this.crypto.builder.did}`;

        // Sign
        await this.crypto.signingProtocol.sign(vcPayload);
        const token = await this.crypto.signingProtocol.serialize();
        return ClaimToken.create(token);
    }

    public async setVcsInPresentations(): Promise<void> {
        const presentations = (<ITestModel>this.responder.responseDefinition).getPresentationsFromModel();
        for (let presentation in presentations) {
            const vcPayload: any = presentations[presentation];
            presentations[presentation] = await this.getVC(vcPayload);
        }
    }

    public async createPresentation(vc: ClaimToken[]): Promise<ClaimToken> {
        let vpTemplate = {
            "jti": "baab2cdccb38408d8f1179071fe37dbe",
            "scope": "openid did_authn verify",
            "vp": {
                "@context": [
                    "https://www.w3.org/2018/credentials/v1"
                ],
                "type": [
                    "VerifiablePresentation"
                ],
                "verifiableCredential": []
            },
            iss: `${this.responder.crypto.builder.did}`,
            aud: `${this.responder.requestor.crypto.builder.did}`,
        };

        for (let inx = 0; inx < vc.length; inx++) {
            (vpTemplate.vp.verifiableCredential as string[]).push(vc[inx].rawToken);
        }
        const token = await (await this.responder.crypto.signingProtocol.sign(Buffer.from(JSON.stringify(vpTemplate)))).serialize();
        return new ClaimToken(TokenType.verifiablePresentation, token, '');
    }
}
