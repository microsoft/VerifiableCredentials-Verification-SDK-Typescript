/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import base64url from 'base64url';
import RequestorHelper from './RequestorHelper';
import ResponderHelper from './ResponderHelper';
import { ValidatorBuilder, PresentationDefinitionModel, IRequestorPresentationExchange } from '../lib';
import VerifiableCredentialConstants from '../lib/verifiable_credential/VerifiableCredentialConstants';
import TokenGenerator from './TokenGenerator';
import PresentationDefinition from './models/PresentationDefinitionSample1'
import RequestOneVcResponseOk from './models/RequestOneVcResponseOk'


const clone = require('clone');
describe('PresentationExchange', () => {
    const model = new RequestOneVcResponseOk();
    const requestor = new RequestorHelper(model);
    let responder: ResponderHelper;

    beforeAll(async () => {
        await requestor.setup();

        responder = new ResponderHelper(requestor, model);
        await responder.setup();
    });

    afterAll(() => {
        TokenGenerator.fetchMock.reset();
    });

    it('should create a requestor', () => {
        const model = new RequestOneVcResponseOk();
        const requestor = new RequestorHelper(model);
        expect((<IRequestorPresentationExchange>requestor.presentationExchangeRequestor).presentationDefinition.name).toEqual(model.request.presentationDefinition.name);
        expect((<IRequestorPresentationExchange>requestor.presentationExchangeRequestor).presentationDefinition.purpose).toEqual(model.request.presentationDefinition.purpose);
        expect((<IRequestorPresentationExchange>requestor.presentationExchangeRequestor).presentationDefinition.input_descriptors![0].id).toEqual(model.request.presentationDefinition.input_descriptors![0].id);
        expect((<IRequestorPresentationExchange>requestor.presentationExchangeRequestor).presentationDefinition.input_descriptors![0].issuance![0].manifest).toEqual(model.request.presentationDefinition.input_descriptors![0].issuance![0].manifest);
    });

    it('should create a request', async () => {
        const request: any = await requestor.createPresentationExchangeRequest();
        expect(request.rawToken).toBeDefined();
        console.log(request.rawToken);
    });

    it('should create a response and validate', async () => {

        const request: any = await requestor.createPresentationExchangeRequest();
        expect(request.rawToken).toBeDefined();
        console.log(request.rawToken);

        const response = await responder.createResponse();

        const validator = new ValidatorBuilder(requestor.crypto)
            .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!] })
            .build();
        let result = await validator.validate(response.rawToken);
        expect(result.result).toBeTruthy();        

        // Negative cases

        //Remove presentation_submission
        let responsePayload = clone(response.decodedToken);
        delete responsePayload.presentation_submission;
        let siop = (await responder.crypto.signingProtocol.sign(Buffer.from(JSON.stringify(responsePayload)))).serialize();
        result = await validator.validate(siop);
        expect(result.result).toBeFalsy();
        expect(result.detailedError).toEqual('SIOP was not recognized.');

        //Remove tokens
        responsePayload = clone(response.decodedToken);
        delete responsePayload.presentation_submission.attestations;
        siop = (await responder.crypto.signingProtocol.sign(Buffer.from(JSON.stringify(responsePayload)))).serialize();
        result = await validator.validate(siop);
        expect(result.result).toBeFalsy();
        expect(result.detailedError).toEqual(`The SIOP presentation exchange response has descriptor_map with id 'IdentityCard'. This path '$.presentation_submission.attestations.presentations.IdentityCard' did not return a token.`);

        //Remove path
        responsePayload = clone(response.decodedToken);
        delete responsePayload.presentation_submission.descriptor_map[0].path;
        siop = (await responder.crypto.signingProtocol.sign(Buffer.from(JSON.stringify(responsePayload)))).serialize();
        result = await validator.validate(siop);
        expect(result.result).toBeFalsy();
        expect(result.detailedError).toEqual(`The SIOP presentation exchange response has descriptor_map with id 'IdentityCard'. No path property found.`);
    });

    it('should populate the model', () => {
        const model: any = new PresentationDefinitionModel().populateFrom(PresentationDefinition.presentationExchangeDefinition.presentationDefinition);
        const requestor = new RequestorHelper(new RequestOneVcResponseOk());
        expect((<IRequestorPresentationExchange>requestor.presentationExchangeRequestor).presentationDefinition.name).toEqual(model.name);
        expect((<IRequestorPresentationExchange>requestor.presentationExchangeRequestor).presentationDefinition.purpose).toEqual(model.purpose);
        expect((<IRequestorPresentationExchange>requestor.presentationExchangeRequestor).presentationDefinition.input_descriptors![0].id).toEqual(model.input_descriptors![0].id);
        expect((<IRequestorPresentationExchange>requestor.presentationExchangeRequestor).presentationDefinition.input_descriptors![0].issuance![0].manifest).toEqual(model.input_descriptors[0].issuance![0].manifest);
    });
});
