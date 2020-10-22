/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import RequestorHelper from './RequestorHelper';
import ResponderHelper from './ResponderHelper';
import { JoseBuilder, ValidatorBuilder } from '../lib';
import TokenGenerator from './TokenGenerator';
import RequestOneVcResponseOk from './models/RequestOneVcResponseOk'
import RequestTwoVcResponseOk from './models/RequestTwoVcResponseOk'
import RequestTwoVcResponseOne from './models/RequestTwoVcResponseOne';
import RequestTwoVcResponseRevoked from './models/RequestTwoVcResponseRevoked';
import RequestAttestationsOneVcSaIdtokenResponseOk from './models/RequestAttestationsOneVcSaIdtokenResponseOk';
import RequestAttestationsOneVcSaIdtokenResponseOne from './models/RequestAttestationsOneVcSaIdtokenResponseOne';
import RequestAttestationsOneVcSaIdtokenResponseNoIdToken from './models/RequestAttestationsOneVcSaIdtokenResponseNoIdToken';
import RequestAttestationsOneSelfAssertedResponseOk from './models/RequestAttestationsOneSelfAssertedResponseOk ';
import RequestAttestationsNameTagOk from './models/RequestAttestationsNameTagOk';
import RequestOneVcResponseMissingId from './models/RequestOneVcResponseMissingId';
import RequestTwoVcPointerToMultipleTokens from './models/RequestTwoVcPointerToMultipleTokens';
import RequestOneJsonLdVcResponseOk from './models/RequestOneJsonLdVcResponseOk';

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
      let result = await validator.validate(<string>response.rawToken);
      expect(result.result).toBeTruthy();

      expect(result.validationResult!.verifiableCredentials!['IdentityCard'].decodedToken.jti).toEqual(model.getVcFromResponse('IdentityCard').decodedToken.jti);
      const jti = result.validationResult!.verifiablePresentations!['IdentityCard'].decodedToken.jti;
      expect(result.validationResult!.verifiablePresentationStatus![jti].status).toEqual('valid');

      const vc = result.validationResult!.verifiableCredentials!['IdentityCard'];
      result = await validator.validate(<string>vc.rawToken);
      expect(result.result).toBeTruthy();

    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  it('should process RequestOneJsonLdVcResponseOk - json ld', async () => {
    try {
      const model = new RequestOneJsonLdVcResponseOk();
      const requestor = new RequestorHelper(model);
      await requestor.setup();
      const request = await requestor.createPresentationExchangeRequest();

      console.log(`Model: ${model.constructor.name}`);
      console.log(`=====> Request: ${request.rawToken}`);

      const responder = new ResponderHelper(requestor, model);
      await responder.setup('EdDSA');

      // add did
      model.response.presentation_submission.attestations.presentations.IdentityCard.credentialSubject.id = responder.crypto.builder.did;

      const response = await responder.createResponse(JoseBuilder.JSONLDProofs);
      console.log(`=====> Response: ${response.rawToken}`);

      const validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!] })
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .build();
      let result = await validator.validate(<string>response.rawToken);
      expect(result.result).toBeTruthy();

      expect(result.validationResult!.verifiableCredentials!['IdentityCard'].decodedToken.id).toEqual(model.getVcFromResponse('IdentityCard').decodedToken.id);
      //const jti = result.validationResult!.verifiablePresentations!['IdentityCard'].decodedToken.id;
      //expect(result.validationResult!.verifiablePresentationStatus![jti].status).toEqual('valid');
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  it('should process RequestOneVcResponseMissingId', async () => {
    try {
      const model = new RequestOneVcResponseMissingId();
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
      let result = await validator.validate(<string>response.rawToken);
      expect(result.result).toBeFalsy();
      expect(result.detailedError).toEqual(`The SIOP presentation exchange response has descriptor_map without id property`);
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
      let result = await validator.validate(<string>response.rawToken);
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

  it('should process RequestTwoVcPointerToMultipleTokens', async () => {
    try {
      const model = new RequestTwoVcPointerToMultipleTokens();
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
      let result = await validator.validate(<string>response.rawToken);
      expect(result.result).toBeFalsy();
      expect(result.detailedError).toEqual(`The SIOP presentation exchange response has descriptor_map with id 'IdentityCard'. This path '$.presentation_submission.attestations.presentations.*' points to multiple credentails and should only point to one credential.`)

    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  xit('should process RequestTwoVcResponseOne', async () => {
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
      let result = await validator.validate(<string>response.rawToken);
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
      let result = await validator.validate(<string>response.rawToken);
      expect(result.result).toBeFalsy();
      expect(result.detailedError?.startsWith('The status receipt for jti ') && result.detailedError?.endsWith(' failed with status revoked.')).toBeTruthy();
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  it('should process RequestAttestationsOneVcSaIdtokenResponseOk', async () => {
    try {
      const model = new RequestAttestationsOneVcSaIdtokenResponseOk();
      const requestor = new RequestorHelper(model);
      await requestor.setup();
      const request = await requestor.createPresentationExchangeRequest();

      console.log(`Model: ${model.constructor.name}`);
      console.log(`=====> Request: ${request.rawToken}`);

      const responder = new ResponderHelper(requestor, model);
      await responder.setup();
      const response = await responder.createResponse();
      console.log(`=====> Response: ${response.rawToken}`);

      let validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ InsuranceCredential: [responder.generator.crypto.builder.did!], DriversLicenseCredential: [responder.generator.crypto.builder.did!] })
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .build();
      let result = await validator.validate(<string>response.rawToken);
      expect(result.result).toBeTruthy();

      expect(result.validationResult!.verifiableCredentials!['InsuranceCredential'].decodedToken.jti).toEqual(model.getVcFromResponse('InsuranceCredential').decodedToken.jti);
      const jtiInsurance = result.validationResult!.verifiablePresentations!['InsuranceCredential'].decodedToken.jti;
      const jtiLicense = result.validationResult!.verifiablePresentations!['DriversLicenseCredential'].decodedToken.jti;
      expect(jtiLicense === jtiInsurance).toBeFalsy();
      expect(result.validationResult!.verifiablePresentationStatus![jtiInsurance].status).toEqual('valid');
      expect(result.validationResult!.verifiablePresentationStatus![jtiLicense].status).toEqual('valid');
      expect(result.validationResult!.idTokens!['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'].decodedToken.firstName).toEqual('Jules');
      expect(result.validationResult?.selfIssued!.decodedToken.name).toEqual('Jules Winnfield');

      // present id token
      validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .build();
      result = await validator.validate(<string>result.validationResult!.idTokens!['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'].rawToken);
      expect(result.result).toBeTruthy();
      expect(result.validationResult!.idTokens!['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'].decodedToken.firstName).toEqual('Jules');

    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  it('should process RequestAttestationsOneVcSaIdtokenResponseOne', async () => {
    try {
      const model = new RequestAttestationsOneVcSaIdtokenResponseOne();
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
        .useTrustedIssuersForVerifiableCredentials({ InsuranceCredential: [responder.generator.crypto.builder.did!], DriversLicenseCredential: [responder.generator.crypto.builder.did!] })
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .build();
      let result = await validator.validate(<string>response.rawToken);
      expect(result.result).toBeFalsy();
      expect(result.detailedError).toEqual(`Verifiable credential 'DriversLicenseCredential' is missing from the input request`);
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  it('should process RequestAttestationsOneVcSaIdtokenResponseNoIdToken', async () => {
    try {
      const model = new RequestAttestationsOneVcSaIdtokenResponseNoIdToken();
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
        .useTrustedIssuersForVerifiableCredentials({ InsuranceCredential: [responder.generator.crypto.builder.did!], DriversLicenseCredential: [responder.generator.crypto.builder.did!] })
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .build();
      let result = await validator.validate(<string>response.rawToken);
      expect(result.result).toBeFalsy();
      expect(result.detailedError).toEqual(`The id token is missing from the input request`);
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });


  it('should process RequestAttestationsOneSelfAssertedResponseOk', async () => {
    try {
      const model = new RequestAttestationsOneSelfAssertedResponseOk();
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
        .build();
      let result = await validator.validate(<string>response.rawToken);
      expect(result.result).toBeTruthy();
      expect(result.validationResult?.selfIssued!.decodedToken.name).toEqual('Jules Winnfield');
      expect(result.validationResult?.idTokens).toBeUndefined();
      expect(result.validationResult?.verifiableCredentials).toBeUndefined();
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });


  it('should process RequestAttestationsNameTagOk', async () => {
    try {
      const model = new RequestAttestationsNameTagOk();
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
        .build();
      let result = await validator.validate(<string>response.rawToken);
      expect(result.result).toBeTruthy();
      expect(result.validationResult?.selfIssued!.decodedToken.name).toEqual('Jules Winnfield');
      expect(result.validationResult?.idTokens).toBeUndefined();
      expect(result.validationResult?.verifiableCredentials).toBeUndefined();
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });
});
