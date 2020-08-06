/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import RequestorHelper from './RequestorHelper';
import ResponderHelper from './ResponderHelper';
import { ValidatorBuilder } from '../lib';
const jp = require('jsonpath');

describe('PresentationExchange', () => {
    const requestor = new RequestorHelper();
    let responder: ResponderHelper;

    beforeAll(async () => {
        await requestor.setup();

        responder = new ResponderHelper(requestor);
        await responder.setup();
    });

    it('should create a requestor', () => {
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

    it('should create a request', async () => {
        const request: any = await requestor.requestor.create();
        expect(request.result).toBeTruthy();
        console.log(request.request);
    });

    fit('should create a response and validate', async () => {


        const request = await responder.createRequest();
        expect(request).toBeDefined();
        console.log(request.rawToken);

        const validator = new ValidatorBuilder(requestor.crypto)
            .useTrustedIssuersForVerifiableCredentials({ DrivingLicense: [responder.generator.crypto.builder.did!] })
            .build();
        const result = await validator.validate(request.rawToken);
        expect(result.result).toBeTruthy();
    });
});