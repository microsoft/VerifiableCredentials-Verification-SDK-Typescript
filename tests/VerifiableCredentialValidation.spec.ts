/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { IssuanceHelpers } from './IssuanceHelpers';
import { VerifiableCredentialValidation } from '../lib/InputValidation/VerifiableCredentialValidation';
import { TokenType, IExpectedVerifiableCredential } from '../lib';
import { IdTokenValidation } from '../lib/InputValidation/IdTokenValidation';

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
    let response = await validator.validate(siop.vc.rawToken, setup.defaultUserDid, siop.contract);
    expect(response.result).toBeTruthy();

    // Negative cases

    // Bad VC signature
    response = await validator.validate(siop.vc.rawToken + 'a', setup.defaultUserDid, siop.contract);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The signature on the payload in the verifiableCredential is invalid');

    // Missing iss
    let payload: any = {
    };
    let token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    validator = new VerifiableCredentialValidation(options, expected);
    response = await validator.validate(token.rawToken, setup.defaultUserDid, siop.contract);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong or missing iss property in verifiableCredential. Expected '["did:test:issuer"]'`);

    // bad sub
    payload = {
      iss: 'did:test:issuer',
      sub: 'test'
    };

    token = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.tokenJwkPrivate);
    response = await validator.validate(token.rawToken, setup.defaultUserDid, siop.contract);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong sub property in verifiableCredential. Expected 'did:test:user'`);
 });
});