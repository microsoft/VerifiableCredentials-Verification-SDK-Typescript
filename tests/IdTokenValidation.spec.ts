/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { IdTokenValidation } from '../lib/input_validation/IdTokenValidation';
import { IssuanceHelpers } from './IssuanceHelpers';
import { TokenType } from '../lib/verifiable_credential/ClaimToken';
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
    let expected = siop.expected.filter((token: IExpectedIdToken) => token.type === TokenType.idToken)[0];

    let validator = new IdTokenValidation(options, expected, Validator.readContractId(siop.contract));
    let response = await validator.validate(siop.idToken.rawToken)
    expect(response.result).toBeTruthy();
    
    const altExpected: any = {configuration: { schema: ['http://example/configuration'] } }
    validator = new IdTokenValidation(options, altExpected, Validator.readContractId(siop.contract));
    response = await validator.validate(siop.idToken.rawToken)
    expect(response.result).toBeTruthy();
    
    // Negative cases

    // Bad token format
    validator = new IdTokenValidation(options, expected, Validator.readContractId(siop.contract));
    response = await validator.validate( '.' + siop.idToken.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(400);
    expect(response.detailedError).toEqual('The idToken could not be deserialized');

    // Bad id token signature
    validator = new IdTokenValidation(options, expected, Validator.readContractId(siop.contract));
    response = await validator.validate(siop.idToken.rawToken + 'a');
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The presented idToken is has an invalid signature');

    // missing siopcontract
    validator = new IdTokenValidation(options, <any>{configuration: {} }, <any>undefined);
    response = await validator.validate(siop.idToken.rawToken);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('The siopContract needs to be specified to validate the idTokens.');

    // missing configuration array in expected
    validator = new IdTokenValidation(options, <any>{configuration: {} }, Validator.readContractId(siop.contract));
    response = await validator.validate(siop.idToken.rawToken);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual(`Expected should have configuration issuers set for idToken. Missing configuration for 'schema'.`);

    // empty array in configuration
    validator = new IdTokenValidation(options, <any>{configuration: [] }, Validator.readContractId(siop.contract));
    response = await validator.validate(siop.idToken.rawToken);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('Expected should have configuration issuers set for idToken. Empty array presented.');

    // missing configuration in expected
    validator = new IdTokenValidation(options, <any>{}, Validator.readContractId(siop.contract));
    response = await validator.validate(siop.idToken.rawToken);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('Expected should have configuration issuers set for idToken');

    // todo fix aud
    return;
  });
 });