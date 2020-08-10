/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRequestorPresentationExchange, PresentationDefinitionModel, PresentationExchangeInputDescriptorModel, PresentationExchangeIssuanceModel, PresentationExchangeSchemaModel, RequestorBuilder, CryptoBuilder, KeyReference, KeyUse, LongFormDid } from '../lib/index';
import TokenGenerator from './TokenGenerator';

export default class RequestorHelper {

    /**
     * the name of the requestor (Relying Party)
     */
    public clientName = 'clientName';

    /**
     * The audience of the requestor
     */
    public audience = 'https://relyingparty.example.com';

    /**
     * explaining the purpose of sending claims to relying party
     */
    public clientPurpose = 'clientPurpose';

    /**
     *  the url where the request came from
     */
    public clientId = 'clientId';

    /**
     *  url to send response to
     */
    public redirectUri = 'redirectUri';

    /**
     * url pointing to terms and service user can open in a webview
     */
    public tosUri = 'tosUri';

    /**
     * url pointing to logo of the requestor (Relying Party)
     */
    public logoUri = 'logoUri';

    public userDid = 'did:user';

    public manifest = 'https://contract.example.com';

    public inputDescriptorId = 'inputDescriptorId';
    public issuance = [new PresentationExchangeIssuanceModel(this.userDid, this.manifest)];

    // Schema props
    public schemaUri = 'https://schema.example.com/drivinglicense';
    public schemaName = 'schemaName';
    public schemaPurpose = 'schemaPurpose';
    public schema = new PresentationExchangeSchemaModel([this.schemaUri], this.schemaName, this.schemaPurpose);

    // presentation definition
    public presentationDefinitionName = 'presentationDefinitionName';
    public presentationDefinitionPurpose = 'presentationDefinitionPurpose';

    public presentationDefinition = new PresentationDefinitionModel(
        [new PresentationExchangeInputDescriptorModel(
            this.inputDescriptorId,
            this.schema,
            this.issuance)],
        this.presentationDefinitionName,
        this.presentationDefinitionPurpose);

    public presentationExchangeModel = {
        presentation_definition: {
            name: this.presentationDefinitionName,
            purpose: this.presentationDefinitionPurpose,
            input_descriptors: [
                {
                    id: this.inputDescriptorId,
                    schema: {
                        uri: this.schemaUri,
                        name: this.schemaName,
                        purpose: this.schemaPurpose
                    },
                    issuance: [
                        {
                          did: this.userDid, 
                          manifest: this.manifest 
                        }
                    ]
                }
            ]
        }

    }
    /**
     * Define the presentation exchange requestor
     */
    public presentationExchangeRequestor: IRequestorPresentationExchange = {

        /**
         * the name of the requestor (Relying Party)
         */
        clientName: this.clientName,

        /**
         * explaining the purpose of sending claims to relying party
         */
        clientPurpose: this.clientPurpose,

        /**
         *  the url where the request came from
         */
        clientId: this.clientId,

        /**
         *  url to send response to
         */
        redirectUri: this.redirectUri,

        /**
         * url pointing to terms and service user can open in a webview
         */
        tosUri: this.tosUri,

        /**
         * url pointing to logo of the requestor (Relying Party)
         */
        logoUri: this.logoUri,

        /**
         * The presentation definition
         */
        presentationDefinition: this.presentationDefinition
    };

    public crypto = new CryptoBuilder()
        .useSigningKeyReference(new KeyReference('signing'))
        .useRecoveryKeyReference(new KeyReference('recovery'))
        .build();

    /**
     * Requestor and builder builder
     */
    public builder = new RequestorBuilder(this.presentationExchangeRequestor, this.crypto)
        .useOidcRequestExpiry(7*3600*24);
    public requestor = this.builder.build();

    public async setup(): Promise<void> {
        this.crypto = await this.crypto.generateKey(KeyUse.Signature, 'signing');
        this.crypto = await this.crypto.generateKey(KeyUse.Signature, 'recovery');
        let did = await new LongFormDid(this.crypto).serialize();
        this.crypto.builder.useDid(did);

        // setup mock to resolve this did
        TokenGenerator.mockResolver(this.crypto);
    }
}
