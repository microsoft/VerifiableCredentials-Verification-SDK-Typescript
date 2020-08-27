/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import base64url from 'base64url';
import RequestorHelper from './RequestorHelper';
import ResponderHelper from './ResponderHelper';
import { ValidatorBuilder } from '../lib';
import TokenGenerator from './TokenGenerator';
import RequestOneVcResponseOk from './models/RequestOneVcResponseOk'
import RequestTwoVcResponseOk from './models/RequestTwoVcResponseOk'
import RequestTwoVcResponseOne from './models/RequestTwoVcResponseOne';
import RequestTwoVcResponseRevoked from './models/RequestTwoVcResponseRevoked';


describe('Rule processor', () => {
    it('should process RequestOneVcResponseOk', async () => {
        try {
            const model = new RequestOneVcResponseOk();
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
                .enableFeatureVerifiedCredentialsStatusCheck(true)
                .build();
            let result = await validator.validate(response.rawToken);
            expect(result.result).toBeTruthy();

            expect(result.validationResult!.verifiableCredentials!['IdentityCard'].decodedToken.jti).toEqual(model.getVcFromResponse('IdentityCard').decodedToken.jti);
            const jti = result.validationResult!.verifiablePresentations!['IdentityCard'].decodedToken.jti;
            expect(result.validationResult!.verifiablePresentationStatus![jti].status).toEqual('valid');
        } finally {
            TokenGenerator.fetchMock.reset();
        }
    });

    it('should process RequestTwoVcResponseOk', async () => {
        try {
            const model = new RequestTwoVcResponseOk();
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
                .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!], Diploma: [responder.generator.crypto.builder.did!] })
                .enableFeatureVerifiedCredentialsStatusCheck(true)
                .build();
            let result = await validator.validate(response.rawToken);
            expect(result.result).toBeTruthy();

            expect(result.validationResult!.verifiableCredentials!['IdentityCard'].decodedToken.jti).toEqual(model.getVcFromResponse('IdentityCard').decodedToken.jti);
            const jtiIdentity = result.validationResult!.verifiablePresentations!['IdentityCard'].decodedToken.jti;
            const jtiDiploma = result.validationResult!.verifiablePresentations!['Diploma'].decodedToken.jti;
            expect(jtiDiploma === jtiIdentity).toBeFalsy();
            expect(result.validationResult!.verifiablePresentationStatus![jtiIdentity].status).toEqual('valid');
            expect(result.validationResult!.verifiablePresentationStatus![jtiDiploma].status).toEqual('valid');
        } finally {
            TokenGenerator.fetchMock.reset();
        }
    });

    it('should process RequestTwoVcResponseOne', async () => {
        try {
            const model = new RequestTwoVcResponseOne();
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
                .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!], Diploma: [responder.generator.crypto.builder.did!] }).enableFeatureVerifiedCredentialsStatusCheck(true)
                .build();
            let result = await validator.validate(response.rawToken);
            expect(result.result).toBeFalsy();
        } finally {
            TokenGenerator.fetchMock.reset();
        }
    });

    it('should process RequestTwoVcResponseRevoked', async () => {
        try {
            const model = new RequestTwoVcResponseRevoked();
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
                .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!], Diploma: [responder.generator.crypto.builder.did!] }).enableFeatureVerifiedCredentialsStatusCheck(true)
                .build();
            let result = await validator.validate(response.rawToken);
            expect(result.result).toBeFalsy();
            expect(result.detailedError?.startsWith('The status receipt for jti ') && result.detailedError?.endsWith(' failed with status revoked.')).toBeTruthy();
        } finally {
            TokenGenerator.fetchMock.reset();
        }
    });
});
