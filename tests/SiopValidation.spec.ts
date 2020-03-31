/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ISiopValidationResponse } from "../lib/InputValidation/SiopValidationResponse";
import { SiopValidation } from "../lib/InputValidation/SiopValidation";
import TestSetup from './TestSetup';
import ValidationOptions from '../lib/Options/ValidationOptions';
import { IssuanceHelpers } from "./IssuanceHelpers";
import { IExpected, TokenType } from "../lib/index";

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
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.siop);   
    const expected: IExpected = siop.expected.filter((token: IExpected) => token.type === TokenType.siop)[0];

    let validationResponse: ISiopValidationResponse = {
      status: 200,
      result: true,
      didKid: setup.defaulUserDidKid
    };    
    
    const validationOptions = new ValidationOptions(setup.validatorOptions, TokenType.siop); 

    const validator = new SiopValidation(validationOptions, expected);
    const response = await validator.validate(request.rawToken);
    expect(response.result).toBeTruthy();
    expect(response.tokensToValidate?.length).toEqual(3);
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
