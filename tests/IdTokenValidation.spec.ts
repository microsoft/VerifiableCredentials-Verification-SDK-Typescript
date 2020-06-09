/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { IdTokenValidation } from '../lib/InputValidation/IdTokenValidation';
import { IssuanceHelpers } from './IssuanceHelpers';
import ClaimToken, { TokenType } from '../lib/VerifiableCredential/ClaimToken';
import { IExpectedIdToken, Validator } from '../lib';

 describe('idTokenValidation', () => {
  let setup: TestSetup;
  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  beforeEach(async () => {
    setup = new TestSetup();
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });
  
  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    setup.fetchMock.reset();
  });

  it('should test validate', async () => {
    
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.idToken, true);   
    const expected = siop.expected.filter((token: IExpectedIdToken) => token.type === TokenType.idToken)[0];

    let validator = new IdTokenValidation(options, expected, Validator.readContractId(siop.contract));
    let response = await validator.validate(siop.idToken.rawToken)
    expect(response.result).toBeTruthy();
    
    // Negative cases

    // Bad id token signature
    response = await validator.validate(siop.idToken.rawToken + 'a');
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The presented idToken is has an invalid signature');

    // todo fix aud
    return;
  });
 });