/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ISiopValidationResponse } from "../lib/input_validation/SiopValidationResponse";
import { SiopValidation } from "../lib/input_validation/SiopValidation";
import TestSetup from './TestSetup';
import ValidationOptions from '../lib/options/ValidationOptions';
import { IssuanceHelpers } from "./IssuanceHelpers";
import { AuthenticationErrorCode, DidValidation, IExpectedSiop, TokenType, ValidatorBuilder } from "../lib/index";
import VerifiableCredentialConstants from "../lib/verifiable_credential/VerifiableCredentialConstants";

describe('SiopValidation', () =>
{
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
  });
  
  afterEach(() => {
    setup.fetchMock.reset();
  });
  
  it('should test validate', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.siopIssuance, true);   
    const expected: IExpectedSiop = siop.expected.filter((token: IExpectedSiop) => token.type === TokenType.siopIssuance)[0];
    const validationOptions = new ValidationOptions(setup.validatorOptions, TokenType.siopIssuance); 

    const validator = new SiopValidation(validationOptions, expected);
    let response = await validator.validate(<string>request.rawToken);
    expect(response.result).toBeTruthy();
    expect(response.tokenId).toBeDefined();
    expect(response.tokenId).toEqual(request.decodedToken.jti);
    
    // Negative cases
    // Missing iss
    let payload: any = {
    };
    let siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Missing iss property in siop. Expected 'https://self-issued.me'`);
    expect(response.code).toEqual('VCSDKVaHe23');
    expect(response.wwwAuthenticateError).toEqual(AuthenticationErrorCode.invalidRequest);
    expect(response.realm).toEqual(VerifiableCredentialConstants.TOKEN_SI_ISS);

    // Bad iss
    payload = {
      iss: 'test'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Wrong iss property in siop. Expected 'https://self-issued.me'`);
    expect(response.code).toEqual('VCSDKVaHe24');
    expect(response.wwwAuthenticateError).toEqual(AuthenticationErrorCode.invalidToken);
    expect(response.realm).toEqual(VerifiableCredentialConstants.TOKEN_SI_ISS);

    // Missing aud
    payload = {
      iss: 'https://self-issued.me'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Missing aud property in siop`);
    expect(response.code).toEqual('VCSDKVaHe25');
    expect(response.wwwAuthenticateError).toEqual(AuthenticationErrorCode.invalidRequest);
    expect(response.realm).toEqual(VerifiableCredentialConstants.TOKEN_SI_ISS);

    // Wrong aud
    payload = {
      iss: 'https://self-issued.me',
      aud: 'test'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Wrong aud property in siop. Expected 'https://portableidentitycards.azure-api.net/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/api/portable/v1.0/card/issue'`);
    expect(response.code).toEqual('VCSDKVaHe26');
    expect(response.wwwAuthenticateError).toEqual(AuthenticationErrorCode.invalidToken);
    expect(response.realm).toEqual(VerifiableCredentialConstants.TOKEN_SI_ISS);

    // Bad validation
    const testValidator = new DidValidation(validationOptions, expected);
    validator.didValidation = testValidator;
    const validateSpy = spyOn(testValidator, 'validate').and.callFake(() => <any>{result: false, detailedError: 'did validation error'});
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.detailedError).toEqual('did validation error');
  });
  
  it('should return status 200', async () => {
    const validator: any =  {};
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
