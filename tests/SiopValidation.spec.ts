/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ISiopValidationResponse } from "../lib/InputValidation/SiopValidationResponse";
import { SiopValidation } from "../lib/InputValidation/SiopValidation";
import TestSetup from './TestSetup';
import { ValidationOptions } from "../lib/index";
import { IssuanceHelpers } from "./IssuanceHelpers";

describe('SiopValidation', () =>
{
  let setup: TestSetup;
  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  beforeEach(async () => {
    setup = new TestSetup();
    await setup.generateKeys();
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });
  
  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });
  
  it('should test validate', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, 'siop');   
    
    let validationResponse: ISiopValidationResponse = {
      status: 200,
      result: true,
      didKid: setup.defaulUserDidKid
    };    
    
    const validationOptions = new ValidationOptions(setup.validatorOptions, 'siop'); 

    const validator = new SiopValidation(validationOptions, siop.expected);
    const response = await validator.validate(request.rawToken);
    expect(response.result).toBeTruthy();
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
