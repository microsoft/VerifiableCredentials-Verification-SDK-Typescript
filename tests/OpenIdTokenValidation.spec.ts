/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { IssuanceHelpers } from './IssuanceHelpers';
import { ClaimToken, OpenIdTokenValidation, IExpectedOpenIdToken, TokenType, ValidatorBuilder } from '../lib';

describe('OpenIdTokenValidation', () => {
  let setup: TestSetup;
  let expected: IExpectedOpenIdToken;

  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  beforeEach(async () => {
    setup = new TestSetup();

    expected = {
      configuration: setup.defaultIdTokenConfiguration,
      audience: setup.tokenAudience,
      type: TokenType.idToken,
    };

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    setup.fetchMock.reset();
  });

  it('should test validate', async () => {
    const [_, options, { idToken }] = await IssuanceHelpers.createRequest(setup, TokenType.idToken, true);
    let validator = new OpenIdTokenValidation(options, expected);
    let response = await validator.validate(idToken)
    expect(response.result).toBeTruthy();

    // Negative cases

    // Bad id token signature
    response = await validator.validate(new ClaimToken(TokenType.idToken, idToken.rawToken + 'a', idToken.id));
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('The presented idToken is has an invalid signature');
    expect(response.code).toEqual('VCSDKVaHe37');
  });

  it('should fail validation when the issuer is incorrect', async () => {
    const [_, options, { idToken }] = await IssuanceHelpers.createRequest(setup, TokenType.idToken, true, 'bad-iss');

    const validator = new OpenIdTokenValidation(options, expected);
    const response = await validator.validate(idToken)
    expect(response.result).toBeFalsy('iss mismatch');
  });

  it('should fail validation when the audience is incorrect', async () => {
    const [_, options, { idToken }] = await IssuanceHelpers.createRequest(setup, TokenType.idToken, true, undefined, 'bad-aud');
    const validator = new OpenIdTokenValidation(options, expected);
    const response = await validator.validate(idToken)
    expect(response.result).toBeFalsy('aud mismatch');
  });

  it('should fail validation when the token is expired', async () => {
    const [_, options, { idToken }] = await IssuanceHelpers.createRequest(setup, TokenType.idToken, true, undefined, undefined, Math.trunc(Date.now() / 1000) - 1000);
    const validator = new OpenIdTokenValidation(options, expected);
    const response = await validator.validate(idToken)
    expect(response.result).toBeFalsy('expired');
  });
});