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
  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  beforeEach(async () => {
    setup = new TestSetup();
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });
  
  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  fit('should test validate', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, 'vc');   
    const expected = siop.expected.filter((token: IExpected) => token.type === TokenType.verifiableCredential)[0];

    let validator = new VerifiableCredentialValidation(options, expected);
    let response = await validator.validate(siop.vc.rawToken);
    expect(response.result).toBeTruthy();

    // Negative cases

    // Bad VC signature
    response = await validator.validate(siop.vc.rawToken + 'a');
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The signature on the payload in the vc is invalid');

    // bad audience
    siop.expected.audience = 'abcdef';
    validator = new VerifiableCredentialValidation(options, siop.expected);
    response = await validator.validate(siop.vc.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('Wrong or missing aud property in vc. Expected abcdef');
 });
});