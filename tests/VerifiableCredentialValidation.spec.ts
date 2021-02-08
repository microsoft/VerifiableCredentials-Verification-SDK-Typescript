/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { IssuanceHelpers } from './IssuanceHelpers';
import { VerifiableCredentialValidation } from '../lib/input_validation/VerifiableCredentialValidation';
import { TokenType, IExpectedVerifiableCredential } from '../lib';
import { VerifiableCredentialValidationResponse } from '../lib/input_validation/VerifiableCredentialValidationResponse';
const clone = require('clone');

describe('VerifiableCredentialValidation', () => {
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
  });
  
  afterEach(() => {
    setup.fetchMock.reset();
  });

  it('should test validate', async () => {
    const [_, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiableCredential, true);   
    const expected = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiableCredential)[0];

    let validator = new VerifiableCredentialValidation(options, expected);
    let response = await validator.validate(siop.vc.rawToken, setup.defaultUserDid);
    expect(response.result).toBeTruthy();
    expect(response.subject).toEqual(setup.defaultUserDid);
    
    // use array of issuers
    let clonedExpected = clone(expected);
    clonedExpected.contractIssuers = [];
    Object.keys(expected.contractIssuers).forEach((type) => {
      expected.contractIssuers[type].forEach((issuer: string) => clonedExpected.contractIssuers.push(issuer));
    });

    validator = new VerifiableCredentialValidation(options, clonedExpected);
    response = await validator.validate(siop.vc.rawToken, setup.defaultUserDid);
    expect(response.result).toBeTruthy();
    expect(response.subject).toEqual(setup.defaultUserDid);

    // Negative cases

    // missing issuers from expected
    clonedExpected = clone(expected);
    response = <VerifiableCredentialValidationResponse>VerifiableCredentialValidation.getIssuersFromExpected(clonedExpected, <any>undefined);
    expect(response.detailedError).toEqual('The credentialType needs to be specified to validate the verifiableCredential.');

    clonedExpected = clone(expected);
    clonedExpected.contractIssuers = [];
    response = <VerifiableCredentialValidationResponse>VerifiableCredentialValidation.getIssuersFromExpected(clonedExpected, 'IdentityCard');
    expect(response.detailedError).toEqual('Expected should have contractIssuers set for verifiableCredential. Empty array presented.');

    delete clonedExpected.contractIssuers;
    response = <VerifiableCredentialValidationResponse>VerifiableCredentialValidation.getIssuersFromExpected(clonedExpected, 'IdentityCard');
    expect(response.detailedError).toEqual('Expected should have contractIssuers set for verifyableCredential');

    // Bad VC signature
    response = await validator.validate(siop.vc.rawToken + 'a', setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The signature on the payload in the verifiableCredential is invalid');

    // Missing vc
    let payload: any = {
    };
    let token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(<string>token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The verifiable credential vc property does not exist`);

    // Missing context
    payload = {
      iss: 'did:test:issuer',
      sub: 'test',
      vc: {}
    };
    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(<string>token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The verifiable credential vc property does not contain @context`);

    // The verifiable credential vc property does not contain https://www.w3.org/2018/credentials/v1
    payload = {
      iss: 'did:test:issuer',
      sub: 'test',
      vc: {
        '\@context': 'xxx'
      }
    };

    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(<string>token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The verifiable credential context first element should be https://www.w3.org/2018/credentials/v1`);
    
    // Missing type
    payload = {
      iss: 'did:test:issuer',
      sub: 'test',
      vc: {
        '\@context': ['https://www.w3.org/2018/credentials/v1']
      }
    };
    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(<string>token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The vc property does not contain type`);
    expect(response.code).toEqual('VCSDKVCVA01');

    // The verifiable credential vc property does not contain https://www.w3.org/2018/credentials/v1
    payload = {
      iss: 'did:test:issuer',
      sub: 'test',
      vc: {
        '\@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
      }
    };

    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(<string>token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The verifiable credential type property should have two elements`);
    expect(response.code).toEqual('VCSDKVCVA02');

    payload = {
      iss: 'did:test:issuer',
      sub: 'test',
      vc: {
        type: ['xxx', 'yyy'],
      }
    };
    payload.vc['@context'] = ['https://www.w3.org/2018/credentials/v1']; 
    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(<string>token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The verifiable credential type first element should be VerifiableCredential`);
    expect(response.code).toEqual('VCSDKVCVA03');

    payload = {
      iss: 'did:test:issuer',
      sub: 'test',
      vc: {
        type: ['VerifiableCredential', 'yyy'],
      }
    };
    payload.vc['@context'] = ['https://www.w3.org/2018/credentials/v1']; 
    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(<string>token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The verifiable credential with type 'yyy' does not has a credentialSubject property`);
    
    // Missing sub
    payload = {
      vc: {
        type: ['VerifiableCredential', 'xxx'],
        credentialSubject: {}
      }
    };
    payload.vc['@context'] =  ['https://www.w3.org/2018/credentials/v1'];
    payload.vc['@context'].push('test');
    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(<string>token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing sub property in verifiableCredential. Expected 'did:test:user'`);

    // bad sub
    payload = {
      vc: {
        type: ['VerifiableCredential', 'xxx'],
        credentialSubject: {}
      },
      iss: 'did:test:issuer',
      sub: 'test'
    };

    payload.vc['@context'] =  ['https://www.w3.org/2018/credentials/v1'];
    payload.vc['@context'].push('test');
    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    response = await validator.validate(<string>token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong sub property in verifiableCredential. Expected 'did:test:user'`);
 });
});