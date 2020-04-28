/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { IssuanceHelpers } from './IssuanceHelpers';
import { VerifiableCredentialValidation } from '../lib/InputValidation/VerifiableCredentialValidation';
import { IExpected, TokenType } from '../lib';
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
    const expected = siop.expected.filter((token: IExpected) => token.type === TokenType.verifiableCredential)[0];

    let validator = new VerifiableCredentialValidation(options, expected, setup.defaultUserDid);
    let response = await validator.validate(siop.vc.rawToken);
    expect(response.result).toBeTruthy();

    // Negative cases

    // Bad VC signature
    response = await validator.validate(siop.vc.rawToken + 'a');
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The signature on the payload in the verifiableCredential is invalid');

    // bad subject
    expected.subject = 'abcdef';
    validator = new VerifiableCredentialValidation(options, expected, setup.defaultUserDid);
    response = await validator.validate(siop.vc.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong sub property in verifiableCredential. Expected 'abcdef'`);
 });
});