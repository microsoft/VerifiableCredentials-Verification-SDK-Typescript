/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { IdTokenValidation } from '../lib/InputValidation/IdTokenValidation';
import { IssuanceHelpers } from './IssuanceHelpers';
import ClaimToken, { TokenType } from '../lib/VerifiableCredential/ClaimToken';
import { IExpected } from '../lib';

 describe('idTokenValidation', () => {
  let setup: TestSetup;
  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  beforeEach(async () => {
    setup = new TestSetup();
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });
  
  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it('should test validate', async () => {
    
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, 'id token');   
    const expected = siop.expected.filter((token: IExpected) => token.type === TokenType.idToken)[0];

    let validator = new IdTokenValidation(options, siop.expected);
    let response = await validator.validate(siop.idToken)
    expect(response.result).toBeTruthy();
    
    // Negative cases

    // Bad id token signature
    response = await validator.validate(new ClaimToken(TokenType.idToken, siop.idToken.rawToken + 'a', siop.idToken.configuration));
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The presented id token is has an invalid signature');

    siop.expected.audience = 'abcdef';
    validator = new IdTokenValidation(options, siop.expected);
    response = await validator.validate(siop.idToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong or missing aud property in id token. Expected 'abcdef'`);
  });
 });