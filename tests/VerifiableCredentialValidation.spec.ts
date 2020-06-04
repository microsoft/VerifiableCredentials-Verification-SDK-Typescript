/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { IssuanceHelpers } from './IssuanceHelpers';
import { VerifiableCredentialValidation } from '../lib/InputValidation/VerifiableCredentialValidation';
import { TokenType, IExpectedVerifiableCredential, Validator } from '../lib';

 describe('VerifiableCredentialValidation', () => {
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
  });
  
  afterEach(() => {
    setup.fetchMock.reset();
  });

  it('should test validate', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiableCredential);   
    const expected = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiableCredential)[0];

    let validator = new VerifiableCredentialValidation(options, expected);
    let response = await validator.validate(siop.vc.rawToken, setup.defaultUserDid);
    expect(response.result).toBeTruthy();

    // Negative cases

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
    response = await validator.validate(token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The verifiable credential does not has the vc property`);

    // Missing context
    payload = {
      iss: 'did:test:issuer',
      sub: 'test',
      vc: {}
    };
    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The verifiable credential vc property does not contain @context`);

    // The verifiable credential vc property does not contain https://www.w3.org/2018/credentials/v1
    payload = {
      iss: 'did:test:issuer',
      sub: 'test',
      vc: {
      }
    };
    payload.vc['@context'] = ['xxx'];

    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The verifiable credential context first element should be https://www.w3.org/2018/credentials/v1`);

    payload.vc['@context'] = ['https://www.w3.org/2018/credentials/v1']; 

    payload.vc['@context'] =  ['xxx'];
    payload.vc['@context'].push('xxx');
    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The verifiable credential context first element should be https://www.w3.org/2018/credentials/v1`);
    
    // Missing type
    payload = {
      iss: 'did:test:issuer',
      sub: 'test',
      vc: {}
    };
    payload.vc['@context'] = ['https://www.w3.org/2018/credentials/v1']; 
    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The vc property does not contain type`);

    // The verifiable credential vc property does not contain https://www.w3.org/2018/credentials/v1
    payload = {
      iss: 'did:test:issuer',
      sub: 'test',
      vc: {
        type: ['VerifiableCredential'],
      }
    };
    payload.vc['@context'] = ['https://www.w3.org/2018/credentials/v1']; 

    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The verifiable credential type property should have two elements`);
    
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
    response = await validator.validate(token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The verifiable credential type first element should be VerifiableCredential`);
    
    // Missing sub
    payload = {
      vc: {
        type: ['VerifiableCredential', 'xxx'],
      }
    };
    payload.vc['@context'] =  ['https://www.w3.org/2018/credentials/v1'];
    payload.vc['@context'].push('test');
    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing sub property in verifiableCredential. Expected 'did:test:user'`);

    // bad sub
    payload = {
      vc: {
        type: ['VerifiableCredential', 'xxx'],
      },
      iss: 'did:test:issuer',
      sub: 'test'
    };

    payload.vc['@context'] =  ['https://www.w3.org/2018/credentials/v1'];
    payload.vc['@context'].push('test');
    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    response = await validator.validate(token.rawToken, setup.defaultUserDid);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong sub property in verifiableCredential. Expected 'did:test:user'`);
 });
});