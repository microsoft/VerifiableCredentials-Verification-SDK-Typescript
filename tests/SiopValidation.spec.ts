/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AuthenticationErrorCode, DidValidation, IExpectedSiop, TokenPayload, TokenType, ValidatorBuilder } from "../lib/index";
import { SiopValidation } from "../lib/input_validation/SiopValidation";
import { ISiopValidationResponse } from "../lib/input_validation/SiopValidationResponse";
import ValidationOptions from '../lib/options/ValidationOptions';
import { IssuanceHelpers } from "./IssuanceHelpers";
import TestSetup from './TestSetup';

describe('SiopValidation', () => {
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup(true);
  });

  afterEach(() => {
    setup.fetchMock.reset();
  });

  async function executeInvalidSiopTokenTest(callback: { (payload: TokenPayload): TokenPayload }, errorCode: number): Promise<void> {
    setup.siopMutator = callback;
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.siopIssuance, true);
    const expected: IExpectedSiop = siop.expected.filter((token: IExpectedSiop) => token.type === TokenType.siopIssuance)[0];
    const validationOptions = new ValidationOptions(setup.validatorOptions, TokenType.siopIssuance);

    const validator = new SiopValidation(validationOptions, expected);
    let response = await validator.validate(request);
    expect(response.result).toBeFalse();
    expect(response.code).toEqual(`VCSDKSIVa0${errorCode}`);
  }

  it('must fail when payload did does not equal the header did', async () => {
    await executeInvalidSiopTokenTest(payload => { return { ...payload, did: 'not a match' } }, 2);
  });

  it('must fail when payload did is missing', async () => {
    await executeInvalidSiopTokenTest(
      payload => {
        const result = { ...payload };
        delete result.did;
        return result;
      },
      2);
  });

  it('must fail when payload sub is missing', async () => {
    await executeInvalidSiopTokenTest(
      payload => {
        const result = { ...payload };
        delete result.sub;
        return result;
      },
      4);
  });

  it('must fail when payload sub_jwk is missing', async () => {
    await executeInvalidSiopTokenTest(
      payload => {
        const result = { ...payload };
        delete result.sub_jwk;
        return result;
      },
      3);
  });

  it('must fail payload on a sub mismatch', async () => {
    await executeInvalidSiopTokenTest(payload => { return { ...payload, sub: 'not a match' } }, 5);
  });

  it('must fail payload on a sub_jwk mismatch', async () => {
    await executeInvalidSiopTokenTest(
      payload => {
        return { ...payload, sub_jwk: { ...payload.sub_jwk, n: 'not a match' } };
      },
      5);
  });

  it('should test validate', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.siopIssuance, true);
    const expected: IExpectedSiop = siop.expected.filter((token: IExpectedSiop) => token.type === TokenType.siopIssuance)[0];
    const validationOptions = new ValidationOptions(setup.validatorOptions, TokenType.siopIssuance);

    const validator = new SiopValidation(validationOptions, expected);
    let response = await validator.validate(request);
    expect(response.result).toBeTruthy();
    expect(response.tokenId).toBeDefined();
    expect(response.tokenId).toEqual(request.decodedToken.jti);
    expect(request.validationResponse).toBeDefined();

    // Negative cases
    // Missing iss
    let payload: any = {};

    let siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Missing iss property in siop. Expected 'https://self-issued.me'`);
    expect(response.code).toEqual('VCSDKVaHe23');
    expect(response.wwwAuthenticateError).toEqual(AuthenticationErrorCode.invalidRequest);
    expect(siopRequest.validationResponse).toBeDefined();

    // a 2nd call must yield the cached result
    response = await validator.validate(siopRequest);
    expect(response === siopRequest.validationResponse).toBeTrue();

    // Bad iss
    payload = {
      iss: 'test'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Wrong iss property in siop. Expected 'https://self-issued.me'`);
    expect(response.code).toEqual('VCSDKVaHe24');
    expect(response.wwwAuthenticateError).toEqual(AuthenticationErrorCode.invalidToken);
    expect(siopRequest.validationResponse).toBeDefined();

    // Missing aud
    payload = {
      iss: 'https://self-issued.me'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Missing aud property in siop`);
    expect(response.code).toEqual('VCSDKVaHe25');
    expect(response.wwwAuthenticateError).toEqual(AuthenticationErrorCode.invalidRequest);
    expect(siopRequest.validationResponse).toBeDefined();

    // Wrong aud
    payload = {
      iss: 'https://self-issued.me',
      aud: 'test'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Wrong aud property in siop. Expected 'https://portableidentitycards.azure-api.net/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/api/portable/v1.0/card/issue'`);
    expect(response.code).toEqual('VCSDKVaHe26');
    expect(response.wwwAuthenticateError).toEqual(AuthenticationErrorCode.invalidToken);
    expect(siopRequest.validationResponse).toBeDefined();

    // Bad validation
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    const testValidator = new DidValidation(validationOptions, expected);
    validator.didValidation = testValidator;
    const validateSpy = spyOn(testValidator, 'validate').and.callFake(() => <any>{ result: false, detailedError: 'did validation error' });
    response = await validator.validate(siopRequest);
    expect(response.detailedError).toEqual('did validation error');
    expect(siopRequest.validationResponse).toBeDefined();
  });

  it('should return status 200', async () => {
    const validator: any = {};
    validator.validate = async () => {
      return {
        result: true,
        detailedError: 'cool',
        status: 200
      }
    };

    const response: ISiopValidationResponse = await validator.validate('body');
    expect(response.result).toBeTruthy();
    expect(response.detailedError).toEqual('cool');
    expect(response.status).toEqual(200);
  });
});
