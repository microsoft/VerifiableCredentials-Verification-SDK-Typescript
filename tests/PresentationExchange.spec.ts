/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import RequestorHelper from './RequestorHelper';
import ResponderHelper from './ResponderHelper';
import { ValidatorBuilder, PresentationDefinitionModel, IRequestorPresentationExchange, JoseBuilder, Validator } from '../lib';
import TokenGenerator from './TokenGenerator';
import PresentationDefinition from './models/PresentationDefinitionSample1'
import RequestOneVcResponseOk from './models/RequestOneVcResponseOk'
import RequestOneJsonLdVcResponseOk from './models/RequestOneJsonLdVcResponseOk';

const clone = require('clone');
describe('PresentationExchange', () => {
  let model = new RequestOneVcResponseOk();
  let requestor = new RequestorHelper(model);
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

    let response = await responder.createResponse();

    let validator = new ValidatorBuilder(requestor.crypto)
      .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!] })
      .build();
    let result = await validator.validate(<string>response.rawToken);
    expect(result.result).toBeTruthy(result.detailedError);

    // Negative cases

    //Remove presentation_submission
    let responsePayload = clone(response.decodedToken);
    delete responsePayload.presentation_submission;
    let siop = await (await responder.crypto.signingProtocol(JoseBuilder.JWT).sign(responsePayload)).serialize();
    result = await validator!.validate(siop);
    expect(result.result).toBeFalsy('Remove presentation_submission');
    expect(result.detailedError).toEqual(`Verifiable credential 'IdentityCard' is missing from the input request`);

    //Remove tokens
    responsePayload = clone(response.decodedToken);
    delete responsePayload.presentation_submission.attestations;
    siop = await (await responder.crypto.signingProtocol(JoseBuilder.JWT).sign(responsePayload)).serialize();
    result = await validator!.validate(siop);
    expect(result.result).toBeFalsy('Remove tokens');
    expect(result.detailedError).toEqual(`The SIOP presentation exchange response has descriptor_map with id 'IdentityCard'. This path '$.presentation_submission.attestations.presentations.IdentityCard' did not return a token.`);

    //Remove path
    responsePayload = clone(response.decodedToken);
    delete responsePayload.presentation_submission.descriptor_map[0].path;
    siop = await (await responder.crypto.signingProtocol(JoseBuilder.JWT).sign(responsePayload)).serialize();
    result = await validator!.validate(siop);
    expect(result.result).toBeFalsy('Remove path');
    expect(result.detailedError).toEqual(`The SIOP presentation exchange response has descriptor_map with id 'IdentityCard'. No path property found.`);
  });

  it('should create a response and validate - json ld', async () => {
    const model = new RequestOneJsonLdVcResponseOk();
    const requestor = new RequestorHelper(model);
    await requestor.setup();
    const responder = new ResponderHelper(requestor, model);
    await responder.setup('EdDSA');

    // add did
    model.response.presentation_submission.attestations.presentations.IdentityCard.credentialSubject.id = responder.crypto.builder.did;

    const request: any = await requestor.createPresentationExchangeRequest();
    expect(request.rawToken).toBeDefined();
    console.log(request.rawToken);

    let response = await responder.createResponse(JoseBuilder.JSONLDProofs);

    let validator = new ValidatorBuilder(requestor.crypto)
      .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!] })
      .build();
    let result = await validator.validate(<string>response.rawToken);
    expect(result.result).toBeTruthy(result.detailedError);
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
