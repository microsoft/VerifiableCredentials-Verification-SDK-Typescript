/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { IdTokenValidation } from '../lib/input_validation/IdTokenValidation';
import { IssuanceHelpers } from './IssuanceHelpers';
import { ClaimToken, IExpectedIdToken, TokenType, Validator, ValidatorBuilder } from '../lib';

describe('idTokenValidation', () => {
  let setup: TestSetup;
  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  beforeEach(() => {
    setup = new TestSetup();
  });
  
  afterEach(() => {
    setup.fetchMock.reset();
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it('should test validate', async () => {
    const [_, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.idToken, true);   
    const expected = siop.expected.filter((token: IExpectedIdToken) => token.type === TokenType.idToken)[0];
    const { contract, idToken } = siop;

    let validator = new IdTokenValidation(options, expected, Validator.readContractId(contract));
    let response = await validator.validate(idToken);
    expect(response.result).toBeTruthy();

    const altExpected: any = {configuration: { schema: ['http://example/configuration'] } }
    validator = new IdTokenValidation(options, altExpected, Validator.readContractId(contract));
    response = await validator.validate(idToken);
    expect(response.result).toBeTruthy();
    
    // Negative cases
    // Bad id token signature
    validator = new IdTokenValidation(options, expected, Validator.readContractId(contract));
    response = await validator.validate(new ClaimToken(TokenType.idToken, idToken.rawToken + 'a', idToken.id));
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('The presented idToken is has an invalid signature');
    expect(response.code).toEqual('VCSDKVaHe37');

    // missing siopcontract
    validator = new IdTokenValidation(options, <any>{configuration: {} }, <any>undefined);
    response = await validator.validate(idToken);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('The siopContract needs to be specified to validate the idTokens.');
    expect(response.code).toEqual('VCSDKIDVa03');

    // missing configuration array in expected
    validator = new IdTokenValidation(options, <any>{configuration: {} }, Validator.readContractId(contract));
    response = await validator.validate(idToken);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual(`Expected should have configuration issuers set for idToken. Missing configuration for 'schema'.`);
    expect(response.code).toEqual('VCSDKIDVa04');

    // empty array in configuration
    validator = new IdTokenValidation(options, <any>{configuration: [] }, Validator.readContractId(contract));
    response = await validator.validate(idToken);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('Expected should have configuration issuers set for idToken. Empty array presented.');
    expect(response.code).toEqual('VCSDKIDVa02');

    // missing configuration in expected
    validator = new IdTokenValidation(options, <any>{}, Validator.readContractId(contract));
    response = await validator.validate(idToken);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('Expected should have configuration issuers set for idToken');
    expect(response.code).toEqual('VCSDKIDVa01');

    // unmatched configuration endpoint
    validator = new IdTokenValidation(options, expected, Validator.readContractId(contract));
    response = await validator.validate(new ClaimToken(TokenType.idToken, idToken.rawToken, 'https://example.com/wrong-config'));
    expect(response.result).toBeFalse();
    expect(response.detailedError).toBeTruthy();
    expect(response.code).toEqual('VCSDKIDVa05');
    expect(response.status).toEqual(403);

    // todo fix aud
  });
});