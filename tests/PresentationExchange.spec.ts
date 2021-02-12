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
import RequestOneJsonLdVcResponseNoProofInVC from './models/RequestOneJsonLdVcResponseNoProofInVC';
import RequestOneJsonLdVcTwoSubjectsResponseOk from './models/RequestOneJsonLdVcTwoSubjectsResponseOk';
import RequestOneJsonLdVcResponseWrongSiopDId from './models/RequestOneJsonLdVcResponseWrongSiopDId';

const clone = require('clone');
describe('PresentationExchange', () => {
  let model = new RequestOneVcResponseOk();
  let requestor = new RequestorHelper(model);
  let responderHelper: ResponderHelper;

  beforeAll(async () => {
    await requestor.setup();

    responderHelper = new ResponderHelper(requestor, model);
    await responderHelper.setup();
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

    let responderResponse = await responderHelper.createResponse();

    let validator = new ValidatorBuilder(requestor.crypto)
      .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responderHelper.generator.crypto.builder.did!] })
      .build();
    let response = await validator.validate(<string>responderResponse.rawToken);
    expect(response.result).toBeTruthy(response.detailedError);

    // Negative cases

    //Empy presentation_submission
    let responsePayload = clone(responderResponse.decodedToken);
    responsePayload.presentation_submission = {};
    let siop = await (await responderHelper.crypto.signingProtocol(JoseBuilder.JWT).sign(responsePayload)).serialize();
    response = await validator!.validate(siop);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual(`Verifiable credential 'IdentityCard' is missing from the input request`);
    expect(response.code).toEqual('VCSDKVTOR04');
    
    //Remove presentation_submission
    delete responsePayload.presentation_submission;
    siop = await (await responderHelper.crypto.signingProtocol(JoseBuilder.JWT).sign(responsePayload)).serialize();
    response = await validator!.validate(siop);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual(`Not a valid SIOP`);
    expect(response.code).toEqual('VCSDKSTVA05');
    
    //Remove tokens
    responsePayload = clone(responderResponse.decodedToken);
    delete responsePayload.presentation_submission.attestations;
    siop = await (await responderHelper.crypto.signingProtocol(JoseBuilder.JWT).sign(responsePayload)).serialize();
    response = await validator!.validate(siop);
    expect(response.result).toBeFalsy('Remove tokens');
    expect(response.detailedError).toEqual(`The SIOP presentation exchange response has descriptor_map with id 'IdentityCard'. This path '$.presentation_submission.attestations.presentations.IdentityCard' did not return a token.`);
    expect(response.code).toEqual('VCSDKSTVA04');

    //Remove path
    responsePayload = clone(responderResponse.decodedToken);
    delete responsePayload.presentation_submission.descriptor_map[0].path;
    siop = await (await responderHelper.crypto.signingProtocol(JoseBuilder.JWT).sign(responsePayload)).serialize();
    response = await validator!.validate(siop);
    expect(response.result).toBeFalsy('Remove path');
    expect(response.detailedError).toEqual(`The SIOP presentation exchange response has descriptor_map with id 'IdentityCard'. No path property found.`);
    expect(response.code).toEqual('VCSDKSTVA04');
  });

  it('should create a response and validate - json ld', async () => {
    let model = new RequestOneJsonLdVcResponseOk();
    let requestor = new RequestorHelper(model);
    await requestor.setup();
    let responderHelper = new ResponderHelper(requestor, model);
    await responderHelper.setup('EdDSA');

    // add did
    model.response.presentation_submission.attestations.presentations.IdentityCard.credentialSubject.id = responderHelper.crypto.builder.did;

    const request: any = await requestor.createPresentationExchangeRequest();
    expect(request.rawToken).toBeDefined();
    console.log(request.rawToken);

    let responderResponse = await responderHelper.createResponse(JoseBuilder.JSONLDProofs);

    let validator = new ValidatorBuilder(requestor.crypto)
      .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responderHelper.generator.crypto.builder.did!] })
      .build();
    let response = await validator.validate(<string>responderResponse.rawToken);
    expect(response.result).toBeTruthy(response.detailedError);

    // Negative cases

    // wrong issuer
    validator = new ValidatorBuilder(requestor.crypto)
      .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [] })
      .build();
    response = await validator.validate(<string>responderResponse.rawToken);
    expect(response.detailedError).toEqual(`The verifiable credential with type 'IdentityCard' is not from a trusted issuer '{"IdentityCard":[]}'`);
    expect(response.code).toEqual('VCSDKVCVA12');

    validator = new ValidatorBuilder(requestor.crypto)
      .useTrustedIssuersForVerifiableCredentials({ IdentityCard: ['some did'] })
      .build();
    response = await validator.validate(<string>responderResponse.rawToken);
    expect(response.detailedError).toEqual(`The verifiable credential with type 'IdentityCard' is not from a trusted issuer '{"IdentityCard":["some did"]}'`);
    expect(response.code).toEqual('VCSDKVCVA12');

    // wrong siop in vc
    model = new RequestOneJsonLdVcResponseWrongSiopDId();
    responderHelper = new ResponderHelper(requestor, model);
    await responderHelper.setup('EdDSA');
    
    responderResponse = await responderHelper.createResponse(JoseBuilder.JSONLDProofs);

    validator = new ValidatorBuilder(requestor.crypto)
      .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responderHelper.generator.crypto.builder.did!] })
      .build();
    response = await validator.validate(<string>responderResponse.rawToken);
    expect(response.detailedError).toEqual(`The verifiable credential with type 'IdentityCard', the id in the credentialSubject property does not match the presenter DID: did:test:responder`);
    expect(response.code).toEqual('VCSDKVCVA11');
  });

  it('should fail because of missing proof in vc - json ld', async () => {
    let model = new RequestOneJsonLdVcResponseNoProofInVC();
    let requestor = new RequestorHelper(model);
    await requestor.setup();
    let responderHelper = new ResponderHelper(requestor, model);
    await responderHelper.setup('EdDSA');

    // add did
    model.response.presentation_submission.attestations.presentations.IdentityCard.credentialSubject.id = responderHelper.crypto.builder.did;
    let responderResponse = await responderHelper.createResponse(JoseBuilder.JSONLDProofs);

    let validator = new ValidatorBuilder(requestor.crypto)
      .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responderHelper.generator.crypto.builder.did!] })
      .build();
    let response = await validator.validate(<string>responderResponse.rawToken);
    expect(response.detailedError).toEqual('The proof is not available in the json ld payload');
    expect(response.code).toEqual('VCSDKVAHE06');

    // missing verificationMethod
    model = new RequestOneJsonLdVcResponseNoProofInVC();
    responderHelper = new ResponderHelper(requestor, model);
    await responderHelper.setup('EdDSA');
    model.responseOperations[0].path += '.verificationMethod';
    responderResponse = await responderHelper.createResponse(JoseBuilder.JSONLDProofs);

    validator = new ValidatorBuilder(requestor.crypto)
      .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responderHelper.generator.crypto.builder.did!] })
      .build();
    response = await validator.validate(<string>responderResponse.rawToken);
    expect(response.detailedError).toEqual('The proof does not contain the verificationMethod in the json ld payload');
    expect(response.code).toEqual('VCSDKVAHE07');
  });

  it('should create a response and validate with VC with two credentialSubject - json ld', async () => {
    const model = new RequestOneJsonLdVcTwoSubjectsResponseOk();
    const requestor = new RequestorHelper(model);
    await requestor.setup();
    const responderHelper = new ResponderHelper(requestor, model);
    await responderHelper.setup('EdDSA');

    // add did
    model.response.presentation_submission.attestations.presentations.IdentityCard.credentialSubject[0].id = responderHelper.crypto.builder.did;

    const request: any = await requestor.createPresentationExchangeRequest();
    expect(request.rawToken).toBeDefined();
    console.log(request.rawToken);

    let responderResponse = await responderHelper.createResponse(JoseBuilder.JSONLDProofs);

    let validator = new ValidatorBuilder(requestor.crypto)
      .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responderHelper.generator.crypto.builder.did!] })
      .build();
    let response = await validator.validate(<string>responderResponse.rawToken);
    expect(response.result).toBeTruthy(response.detailedError);
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
