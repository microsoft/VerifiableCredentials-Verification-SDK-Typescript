/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import base64url from 'base64url';
import RequestorHelper from './RequestorHelper';
import ResponderHelper from './ResponderHelper';
import { ValidatorBuilder, ClaimToken, TokenType, PresentationDefinitionModel, IRequestorPresentationExchange, Requestor } from '../lib';
import VerifiableCredentialConstants from '../lib/verifiable_credential/VerifiableCredentialConstants';
import TokenGenerator from './TokenGenerator';
import PresentationDefinition from './models/PresentationDefinitionSample1'
import RequestOnceVcResponseOk from './models/RequestOnceVcResponseOk'

const jp = require('jsonpath');
const clone = require('clone');


describe('Rule processor', () => {
    it('should process RequestOnceVcResponseOk', async () => {
        try {
            const model = new RequestOnceVcResponseOk();
            const requestor = new RequestorHelper(model);
            await requestor.setup();
            const request = await requestor.createPresentationExchangeRequest();

            console.log(`Model: ${model.constructor.name}`);
            console.log(`=====> Request: ${request.rawToken}`);

            const responder = new ResponderHelper(requestor, model);
            await responder.setup();
            const response = await responder.createResponse();
            console.log(`=====> Response: ${response.rawToken}`);

            const validator = new ValidatorBuilder(requestor.crypto)
                .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!] })
                .build();
            let result = await validator.validate(response.rawToken);
            expect(result.result).toBeTruthy();
            expect(result.validationResult!.verifiableCredentials!['IdentityCard'].decodedToken.jti).toEqual(model.getVcFromResponse('IdentityCard').decodedToken.jti);
        } finally {
            TokenGenerator.fetchMock.reset();
        }

    });
});

describe('PresentationExchange', () => {
    const model = new RequestOnceVcResponseOk();
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
        const model = new RequestOnceVcResponseOk();
        const requestor = new RequestorHelper(model);
        expect(requestor.presentationExchangeRequestor.presentationDefinition.name).toEqual(model.presentationExchangeRequest.presentationDefinition.name);
        expect(requestor.presentationExchangeRequestor.presentationDefinition.purpose).toEqual(model.presentationExchangeRequest.presentationDefinition.purpose);
        expect(requestor.presentationExchangeRequestor.presentationDefinition.input_descriptors![0].id).toEqual(model.presentationExchangeRequest.presentationDefinition.input_descriptors![0].id);
        expect(requestor.presentationExchangeRequestor.presentationDefinition.input_descriptors![0].issuance![0].manifest).toEqual(model.presentationExchangeRequest.presentationDefinition.input_descriptors![0].issuance![0].manifest);
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
        expect(result.detailedError).toEqual(`The SIOP presentation exchange response has descriptor_map with id 'IdentityCard'. This path '$.presentation_submission.attestations.presentations' did not return any tokens.`);

        //Remove path
        responsePayload = clone(response.decodedToken);
        delete responsePayload.presentation_submission.descriptor_map[0].path;
        siop = (await responder.crypto.signingProtocol.sign(Buffer.from(JSON.stringify(responsePayload)))).serialize();
        result = await validator.validate(siop);
        expect(result.result).toBeFalsy();
        expect(result.detailedError).toEqual(`The SIOP presentation exchange response has descriptor_map with id 'IdentityCard'. No path property found.`);
    });

    it('should not validate siop with only selfissued', async () => {
        const header = { typ: "JWT" };
        const payload = {
            firstName: 'Vincent',
            lastName: 'Vega'
        };
        const token = base64url.encode(JSON.stringify(header)) + '.' + base64url.encode(JSON.stringify(payload)) + '.';


        const request = {
            presentation_submission: {
                descriptor_map: [{
                    id: requestor.inputDescriptorId,
                    format: 'jwt',
                    encoding: 'base64url',
                    path: '$.tokens.presentations'
                }]
            },
            tokens: {
                presentations: {
                    DrivingLicense: token
                }
            },
            iss: `${VerifiableCredentialConstants.TOKEN_SI_ISS}`,
            aud: `${requestor.audience}`
        };

        const siop = (await requestor.crypto.signingProtocol.sign(Buffer.from(JSON.stringify(request)))).serialize();
        const validator = new ValidatorBuilder(requestor.crypto)
            .useTrustedIssuersForVerifiableCredentials({ DrivingLicense: [responder.generator.crypto.builder.did!] })
            .build();
        let result = await validator.validate(siop);
        expect(result.result).toBeFalsy();
        expect(result.detailedError).toEqual('No signed token found during validation');
    });

    it('should populate the model', () => {
        const model: any = new PresentationDefinitionModel().populateFrom(PresentationDefinition.presentationExchangeDefinition.presentationDefinition);
        const requestor = new RequestorHelper(new RequestOnceVcResponseOk());
        expect(requestor.presentationExchangeRequestor.presentationDefinition.name).toEqual(model.name);
        expect(requestor.presentationExchangeRequestor.presentationDefinition.purpose).toEqual(model.purpose);
        expect(requestor.presentationExchangeRequestor.presentationDefinition.input_descriptors![0].id).toEqual(model.input_descriptors![0].id);
        expect(requestor.presentationExchangeRequestor.presentationDefinition.input_descriptors![0].issuance![0].manifest).toEqual(model.input_descriptors[0].issuance![0].manifest);
    });
});
