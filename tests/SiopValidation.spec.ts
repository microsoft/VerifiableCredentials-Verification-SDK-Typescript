/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ISiopValidationResponse } from "../lib/InputValidation/SiopValidationResponse";
import { SiopValidation } from "../lib/InputValidation/SiopValidation";
import TestSetup from './TestSetup';
import ValidationOptions from '../lib/Options/ValidationOptions';
import { IssuanceHelpers } from "./IssuanceHelpers";
import { IExpectedSiop, TokenType } from "../lib/index";

describe('SiopValidation', () =>
{
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
  });
  
  afterEach(() => {
    setup.fetchMock.reset();
  });
  
  xit('should test validate', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.siopIssuance, true);   
    const expected: IExpectedSiop = siop.expected.filter((token: IExpectedSiop) => token.type === TokenType.siopIssuance)[0];
    const validationOptions = new ValidationOptions(setup.validatorOptions, TokenType.siopIssuance); 

    const validator = new SiopValidation(validationOptions, expected);
    let response = await validator.validate(request.rawToken);
    expect(response.result).toBeTruthy();
    expect(response.jti).toBeDefined();
    expect(response.jti).toEqual(request.decodedToken.jti);
    
    // Negative cases
    // Missing iss
    let payload: any = {
    };
    let siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing iss property in siop. Expected 'https://self-issued.me'`);

    // Bad iss
    payload = {
      iss: 'test'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong iss property in siop. Expected 'https://self-issued.me'`);

    // Missing aud
    payload = {
      iss: 'https://self-issued.me'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing aud property in siop`);

    // Wrong aud
    payload = {
      iss: 'https://self-issued.me',
      aud: 'test'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong aud property in siop. Expected 'https://portableidentitycards.azure-api.net/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/api/portable/v1.0/card/issue'`);

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
