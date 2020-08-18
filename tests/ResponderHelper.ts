/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CryptoBuilder, KeyReference, LongFormDid, KeyUse, TokenType, ClaimToken } from '../lib/index';
import RequestorHelper from './RequestorHelper'
import TokenGenerator from './TokenGenerator';
import VerifiableCredentialConstants from '../lib/verifiable_credential/VerifiableCredentialConstants';
import ITestModel from './models/ITestModel';

export default class ResponderHelper {
    constructor(public requestor: RequestorHelper, public responseDefinition: ITestModel) {
    }

    public crypto = new CryptoBuilder()
        .useSigningKeyReference(new KeyReference('signing'))
        .useRecoveryKeyReference(new KeyReference('recovery'))
        .build();

    public vcPayload = {
        givenName: 'Jules',
        familyName: 'Winnfield'
    };

    public generator = new TokenGenerator(this);

    public async setup(): Promise<void> {
        this.crypto = await this.crypto.generateKey(KeyUse.Signature, 'signing');
        this.crypto = await this.crypto.generateKey(KeyUse.Signature, 'recovery');
        let did = await new LongFormDid(this.crypto).serialize();
        this.crypto.builder.useDid(did);

        // setup mock so requestor can resolve this did
        TokenGenerator.mockResolver(this.crypto);

        await this.generator.setup();
    }

    public async createResponse(): Promise<ClaimToken> {
        
        await this.generator.setVcs();
        const payload = this.responseDefinition.presentationExchangeResponse;

        const token = (await this.crypto.signingProtocol.sign(Buffer.from(JSON.stringify(payload)))).serialize();
        return new ClaimToken(TokenType.siopPresentationAttestation, token, '');
    }

}