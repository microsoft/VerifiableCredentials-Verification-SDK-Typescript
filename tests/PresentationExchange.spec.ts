/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRequestorPresentationExchange, PresentationDefinitionModel, InputDescriptorModel, PresentationExchangeIssuanceModel, PresentationExchangeSchemaModel, RequestorBuilder, CryptoBuilder, KeyReference, KeyUse, LongFormDid } from '../lib/index';
import RequestorHelper from './RequestorHelper';

describe('PresentationExchange', () => {
    it ('should create a requestor', () => {
        const requestor = new RequestorHelper();
        expect(requestor.clientId).toEqual(requestor.clientId);
        expect(requestor.clientName).toEqual(requestor.clientName);
        expect(requestor.clientPurpose).toEqual(requestor.clientPurpose);
        expect(requestor.presentationExchangeRequestor.clientId).toEqual(requestor.clientId);
        expect(requestor.presentationExchangeRequestor.clientName).toEqual(requestor.clientName);
        expect(requestor.presentationExchangeRequestor.clientPurpose).toEqual(requestor.clientPurpose);
        expect(requestor.presentationExchangeRequestor.logoUri).toEqual(requestor.logoUri);
        expect(requestor.presentationExchangeRequestor.redirectUri).toEqual(requestor.redirectUri);
        expect(requestor.presentationExchangeRequestor.tosUri).toEqual(requestor.tosUri);
        expect(requestor.presentationExchangeRequestor.presentationDefinition.name).toEqual(requestor.presentationDefinitionName);
        expect(requestor.presentationExchangeRequestor.presentationDefinition.purpose).toEqual(requestor.presentationDefinitionPurpose);
        expect(requestor.presentationExchangeRequestor.presentationDefinition.input_descriptors[0].id).toEqual(requestor.inputDescriptorId);
        expect(requestor.presentationExchangeRequestor.presentationDefinition.input_descriptors[0].issuance![0].did).toEqual(requestor.userDid);
        expect(requestor.presentationExchangeRequestor.presentationDefinition.input_descriptors[0].issuance![0].manifest).toEqual(requestor.manifest);
    });

    it ('should create a request', async () => {
        const requestor = new RequestorHelper();
        requestor.crypto = await requestor.crypto.generateKey(KeyUse.Signature, 'signing');
        requestor.crypto = await requestor.crypto.generateKey(KeyUse.Signature, 'recovery');
        const did = await new LongFormDid(requestor.crypto).serialize();
        requestor.crypto.builder.useDid(did);

        const request: any = await requestor.requestor.create();
        expect(request.result).toBeTruthy();
        console.log(request.request);

    });
});