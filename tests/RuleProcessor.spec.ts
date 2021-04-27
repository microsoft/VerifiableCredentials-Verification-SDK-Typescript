/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import RequestorHelper from './RequestorHelper';
import ResponderHelper from './ResponderHelper';
import { JoseBuilder, TokenType, Validator, ValidatorBuilder, VerifiablePresentationValidation } from '../lib';
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
  let doRequestResponder: ResponderHelper;
  let doRequestValidator: Validator;
  
  const doRequest = async (model?: any): Promise<any> => {
    if (!model) {
      model = new RequestOneVcResponseOk();
    }
    const requestor = new RequestorHelper(model);
    await requestor.setup();
    const request = await requestor.createPresentationExchangeRequest();
  
    console.log(`Model: ${model.constructor.name}`);
    console.log(`=====> Request: ${request.rawToken}`);
  
    doRequestResponder = new ResponderHelper(requestor, model);
    await doRequestResponder.setup();
  
    doRequestValidator = new ValidatorBuilder(requestor.crypto)
      .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [doRequestResponder.generator.crypto.builder.did!] })
      .enableFeatureVerifiedCredentialsStatusCheck(true)
      .build();
  
      const responderResponse = await doRequestResponder.createResponse();
    console.log(`=====> Response: ${responderResponse.rawToken}`);
        
    return [doRequestValidator, model, responderResponse, doRequestResponder];
  }      

  it('should process RequestOneVcResponseOk', async () => {
    try {
      let [validator, model, responderResponse] = await doRequest();
      let response = await validator.validate(responderResponse);
      expect(response.result).toBeTruthy();

      expect(response.validationResult!.verifiableCredentials!['IdentityCard'].decodedToken.jti).toEqual(model.getVcFromResponse('IdentityCard').decodedToken.jti);
      const jti = response.validationResult!.verifiablePresentations!['IdentityCard'].decodedToken.jti;
      expect(response.validationResult!.verifiablePresentationStatus![jti].status).toEqual('valid');

      const vc = response.validationResult!.verifiableCredentials!['IdentityCard'];
      response = await validator.validate(<string>vc.rawToken);
      expect(response.result).toBeTruthy();

    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });
  it('should process RequestOneVcResponseOk with bad status', async () => {
    try {
      let [validator, model, responderResponse] = await doRequest();
          
      // Status mock
      TokenGenerator.fetchMock.post('https://status.example.com', {status: 400, body: {}}, { overwriteRoutes: true });

      let response = await validator.validate(responderResponse);
      expect(response.result).toBeFalsy(response.detailedError);
      expect(response.code).toEqual('VCSDKVtor06');
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });
  it('should process RequestAttestationsOneVcSaIdtokenResponseOk with missing attestations in SIOP', async () => {
    try {
      const model: any = new RequestAttestationsOneVcSaIdtokenResponseOk();
      model.preSiopResponseOperations = [
        {
          path: '$.attestations',
          operation: () => undefined
        }
      ];
      let [validator, _, responderResponse, responder] = await doRequest(model);
  
      let response = await validator.validate(responderResponse);
      expect(response.result).toBeFalsy(response.detailedError);
      expect(response.code).toEqual('VCSDKSTVa05');
      expect(response.status).toEqual(401);
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  it('should process RequestAttestationsOneVcSaIdtokenResponseOk:  The jti claim is missing', async () => {
    try {
      const model: any = new RequestAttestationsOneVcSaIdtokenResponseOk();
      model.preSiopResponseOperations = [
        {
          path: '$.jti',
          operation: () => undefined
        }
      ];
      let [validator, _, responderResponse, responder] = await doRequest(model);
      validator
        .builder        
        .useTrustedIssuersForVerifiableCredentials({ InsuranceCredential: [responder.generator.crypto.builder.did!], DriversLicenseCredential: [responder.generator.crypto.builder.did!] })
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .enableFeatureVerifiedCredentialsStatusCheck(true);

      let response = await validator.validate(responderResponse);
      expect(response.result).toBeFalsy(response.detailedError);
      expect(response.code).toEqual('VCSDKSIVa01');
      expect(response.status).toEqual(400);
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  it('should process RequestAttestationsOneVcSaIdtokenResponseOk with malformed attestations in SIOP', async () => {
    try {
      const model: any = new RequestAttestationsOneVcSaIdtokenResponseOk();
      model.preSiopResponseOperations = [
        {
          path: '$.attestations',
          operation: () => 'fault'
        }
      ];
      let [validator, _, responderResponse, responder] = await doRequest(model);
  
      let response = await validator.validate(responderResponse);
      expect(response.result).toBeFalsy(response.detailedError);
      expect(response.code).toEqual('VCSDKSTVa03');
      expect(response.status).toEqual(400);
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });
  
  it('should process RequestAttestationsOneVcSaIdtokenResponseOk:  An attestation is not yet valid', async () => {
    try {
      const model: any = new RequestAttestationsOneVcSaIdtokenResponseOk();
      model.preSignatureResponseOperations = [
        {
          path: '$.attestations.presentations.DriversLicenseCredential',
          operation: (selectedProperty: any) => {
            selectedProperty.nbf = 9613052815;
            return selectedProperty;
          }
        }
      ];
      let [validator, _, responderResponse, responder] = await doRequest(model);
      validator
        .builder        
        .useTrustedIssuersForVerifiableCredentials({ InsuranceCredential: [responder.generator.crypto.builder.did!], DriversLicenseCredential: [responder.generator.crypto.builder.did!] })
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .enableFeatureVerifiedCredentialsStatusCheck(true);

      let response = await validator.validate(responderResponse);
      expect(response.result).toBeFalsy(response.detailedError);
      expect(response.code).toEqual('VCSDKVaHe40');
      expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  it('should process RequestAttestationsOneVcSaIdtokenResponseOk:  An attestation is expired', async () => {
    try {
      const model: any = new RequestAttestationsOneVcSaIdtokenResponseOk();
      model.preSignatureResponseOperations = [
        {
          path: '$.attestations.presentations.DriversLicenseCredential',
          operation: (selectedProperty: any) => {
            selectedProperty.exp = 5;
            return selectedProperty;
          }
        }
      ];
      let [validator, _, responderResponse, responder] = await doRequest(model);
      validator
        .builder        
        .useTrustedIssuersForVerifiableCredentials({ InsuranceCredential: [responder.generator.crypto.builder.did!], DriversLicenseCredential: [responder.generator.crypto.builder.did!] })
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .enableFeatureVerifiedCredentialsStatusCheck(true);

      let response = await validator.validate(responderResponse);
      expect(response.result).toBeFalsy(response.detailedError);
      expect(response.code).toEqual('VCSDKVaHe12');
      expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  it('should process RequestAttestationsOneVcSaIdtokenResponseOk:  An attestation signature is invalid', async () => {
    try {
      const model: any = new RequestAttestationsOneVcSaIdtokenResponseOk();
      model.preSiopResponseOperations = [
        {
          path: '$.attestations.presentations.DriversLicenseCredential',
          operation: (selectedProperty: any) => {
            const splitted = selectedProperty.split('.');
            splitted[2] +='1111';
            return `${splitted[0]}.${splitted[1]}.${splitted[2]}`;
          }
        }
      ];
      let [validator, _, responderResponse, responder] = await doRequest(model);
      validator
        .builder        
        .useTrustedIssuersForVerifiableCredentials({ InsuranceCredential: [responder.generator.crypto.builder.did!], DriversLicenseCredential: [responder.generator.crypto.builder.did!] })
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .enableFeatureVerifiedCredentialsStatusCheck(true);

      let response = await validator.validate(responderResponse);
      expect(response.result).toBeFalsy(response.detailedError);
      expect(response.code).toEqual('VCSDKVaHe28');
      expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  it('should process RequestAttestationsOneVcSaIdtokenResponseOk:  An attestation signature is invalid', async () => {
    try {
      const model: any = new RequestAttestationsOneVcSaIdtokenResponseOk();
      model.preSiopResponseOperations = [
        {
          path: '$.attestations.presentations.DriversLicenseCredential',
          operation: (selectedProperty: any) => {
            const splitted = selectedProperty.split('.');
            splitted[2] +='1111';
            return `${splitted[0]}.${splitted[1]}.${splitted[2]}`;
          }
        }
      ];
      let [validator, _, responderResponse, responder] = await doRequest(model);
      validator
        .builder        
        .useTrustedIssuersForVerifiableCredentials({ InsuranceCredential: [responder.generator.crypto.builder.did!], DriversLicenseCredential: [responder.generator.crypto.builder.did!] })
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .enableFeatureVerifiedCredentialsStatusCheck(true);

      let response = await validator.validate(responderResponse);
      expect(response.result).toBeFalsy(response.detailedError);
      expect(response.code).toEqual('VCSDKVaHe28');
      expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
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

      const responderResponse = await responder.createResponse(JoseBuilder.JSONLDProofs);
      console.log(`=====> Response: ${responderResponse.rawToken}`);

      const validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!] })
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .build();
      let response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeTruthy();

      expect(response.validationResult!.verifiableCredentials!['IdentityCard'].decodedToken.id).toEqual(model.getVcFromResponse('IdentityCard').decodedToken.id);
      //const jti = response.validationResult!.verifiablePresentations!['IdentityCard'].decodedToken.id;
      //expect(response.validationResult!.verifiablePresentationStatus![jti].status).toEqual('valid');
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
      const responderResponse = await responder.createResponse();
      console.log(`=====> Response: ${responderResponse.rawToken}`);

      const validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!], Diploma: [responder.generator.crypto.builder.did!] })
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .build();
      let response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeFalsy();
      expect(response.detailedError).toEqual(`The SIOP presentation exchange response has descriptor_map without id property`);
      expect(response.code).toEqual('VCSDKSTVa04');
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  it('should process RequestTwoVcResponseOk with limiting validation safeguards', async () => {
    try {
      const model = new RequestTwoVcResponseOk();
      const requestor = new RequestorHelper(model);
      await requestor.setup();
      const request = await requestor.createPresentationExchangeRequest();

      console.log(`Model: ${model.constructor.name}`);
      console.log(`=====> Request: ${request.rawToken}`);

      const responder = new ResponderHelper(requestor, model);
      await responder.setup();
      const responderResponse = await responder.createResponse();
      console.log(`=====> Response: ${responderResponse.rawToken}`);

      // Check max VC size
      let validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!], Diploma: [responder.generator.crypto.builder.did!] })
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .useMaxSizeOfVCTokensInPresentation(10)
        .build();
      let response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeFalsy();
      expect(response.code).toEqual('VCSDKVPTV03');
      validator.builder.useMaxSizeOfVCTokensInPresentation(16*1024*1024);
      
      // Check max VP size
      validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!], Diploma: [responder.generator.crypto.builder.did!] })
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .useMaxSizeOfVPTokensInSiop(10)
        .build();
      response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeFalsy();
      expect(response.code).toEqual('VCSDKSTVa07');
      validator.builder.useMaxSizeOfVPTokensInSiop(16*1024*1024);
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });

  xit('should process maximum presentations', async () => {
    try {
      const model = new RequestTwoVcResponseOk();
      const requestor = new RequestorHelper(model);
      await requestor.setup();
      const request = await requestor.createPresentationExchangeRequest();

      console.log(`Model: ${model.constructor.name}`);
      console.log(`=====> Request: ${request.rawToken}`);

      const responder = new ResponderHelper(requestor, model);
      await responder.setup();
      const responderResponse = await responder.createResponse();
      console.log(`=====> Response: ${responderResponse.rawToken}`);

      // Check max VC size
      let validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!] })
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .build();
      let response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeFalsy();
      expect(response.code).toEqual('VCSDKVPTV03');
      validator.builder.useMaxSizeOfVCTokensInPresentation(16*1024*1024);
    }finally {
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
      const responderResponse = await responder.createResponse();
      console.log(`=====> Response: ${responderResponse.rawToken}`);

      const validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!], Diploma: [responder.generator.crypto.builder.did!] })
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .build();
      let response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeFalsy();
      expect(response.detailedError).toEqual(`The SIOP presentation exchange response has descriptor_map with id 'IdentityCard'. This path '$.presentation_submission.attestations.presentations.*' points to multiple credentails and should only point to one credential.`)
      expect(response.code).toEqual('VCSDKSTVa04');
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
      const responderResponse = await responder.createResponse();
      console.log(`=====> Response: ${responderResponse.rawToken}`);

      const validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!], Diploma: [responder.generator.crypto.builder.did!] }).enableFeatureVerifiedCredentialsStatusCheck(true)
        .build();
      let response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeFalsy();
      expect(response.detailedError).toEqual(`Verifiable credential 'Diploma' is missing from the input request`);
      expect(response.code).toEqual('VCSDKVtor04');
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
      const responderResponse = await responder.createResponse();
      console.log(`=====> Response: ${responderResponse.rawToken}`);

      const validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ IdentityCard: [responder.generator.crypto.builder.did!], Diploma: [responder.generator.crypto.builder.did!] }).enableFeatureVerifiedCredentialsStatusCheck(true)
        .build();
      let response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeFalsy();
      expect(response.detailedError?.startsWith('The status receipt for jti ') && response.detailedError?.endsWith(' failed with status revoked.')).toBeTruthy();
      expect(response.code).toEqual('VCSDKVtor07');
      expect(response.status).toEqual(403);
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
      const responderResponse = await responder.createResponse();
      console.log(`=====> Response: ${responderResponse.rawToken}`);

      let validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ InsuranceCredential: [responder.generator.crypto.builder.did!], DriversLicenseCredential: [responder.generator.crypto.builder.did!] })
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .build();
      let response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeTruthy();

      expect(response.validationResult!.verifiableCredentials!['InsuranceCredential'].decodedToken.jti).toEqual(model.getVcFromResponse('InsuranceCredential').decodedToken.jti);
      const jtiInsurance = response.validationResult!.verifiablePresentations!['InsuranceCredential'].decodedToken.jti;
      const jtiLicense = response.validationResult!.verifiablePresentations!['DriversLicenseCredential'].decodedToken.jti;
      expect(jtiLicense === jtiInsurance).toBeFalsy();
      expect(response.validationResult!.verifiablePresentationStatus![jtiInsurance].status).toEqual('valid');
      expect(response.validationResult!.verifiablePresentationStatus![jtiLicense].status).toEqual('valid');
      expect(response.validationResult!.idTokens!['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'].decodedToken.firstName).toEqual('Jules');
      expect(response.validationResult?.selfIssued!.decodedToken.name).toEqual('Jules Winnfield');

      // present id token
      validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .build();
      response = await validator.validate(<string>response.validationResult!.idTokens!['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'].rawToken);
      expect(response.result).toBeTruthy();
      expect(response.validationResult!.idTokens!['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'].decodedToken.firstName).toEqual('Jules');

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
      const responderResponse = await responder.createResponse();
      console.log(`=====> Response: ${responderResponse.rawToken}`);

      const validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ InsuranceCredential: [responder.generator.crypto.builder.did!], DriversLicenseCredential: [responder.generator.crypto.builder.did!] })
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .build();
      let response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeFalsy();
      expect(response.detailedError).toEqual(`Verifiable credential 'DriversLicenseCredential' is missing from the input request`);
      expect(response.code).toEqual('VCSDKVtor04');
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
      const responderResponse = await responder.createResponse();
      console.log(`=====> Response: ${responderResponse.rawToken}`);

      const validator = new ValidatorBuilder(requestor.crypto)
        .useTrustedIssuersForVerifiableCredentials({ InsuranceCredential: [responder.generator.crypto.builder.did!], DriversLicenseCredential: [responder.generator.crypto.builder.did!] })
        .enableFeatureVerifiedCredentialsStatusCheck(true)
        .useTrustedIssuerConfigurationsForIdTokens(['https://pics-linux.azurewebsites.net/test/oidc/openid-configuration'])
        .build();
      let response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeFalsy();
      expect(response.detailedError).toEqual(`The id token is missing from the input request`);
      expect(response.code).toEqual('VCSDKVtor05');
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
      const responderResponse = await responder.createResponse();
      console.log(`=====> Response: ${responderResponse.rawToken}`);

      const validator = new ValidatorBuilder(requestor.crypto)
        .build();
      let response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeTruthy();
      expect(response.validationResult?.selfIssued!.decodedToken.name).toEqual('Jules Winnfield');
      expect(response.validationResult?.idTokens).toBeUndefined();
      expect(response.validationResult?.verifiableCredentials).toBeUndefined();
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
      const responderResponse = await responder.createResponse();
      console.log(`=====> Response: ${responderResponse.rawToken}`);

      const validator = new ValidatorBuilder(requestor.crypto)
        .build();
      let response = await validator.validate(<string>responderResponse.rawToken);
      expect(response.result).toBeTruthy();
      expect(response.validationResult?.selfIssued!.decodedToken.name).toEqual('Jules Winnfield');
      expect(response.validationResult?.idTokens).toBeUndefined();
      expect(response.validationResult?.verifiableCredentials).toBeUndefined();
    } finally {
      TokenGenerator.fetchMock.reset();
    }
  });
});
