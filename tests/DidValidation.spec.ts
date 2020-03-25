/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import TestSetup from './TestSetup';
import { ValidationOptions } from "../lib/index";
import { IssuanceHelpers } from "./IssuanceHelpers";
import { IDidValidationResponse } from "../lib/InputValidation/DidValidationResponse";
import { DidValidation } from "../lib/InputValidation/DidValidation";
import VerifiableCredentialConstants from "../lib/VerifiableCredential/VerifiableCredentialConstants";

describe('DidValidation', () =>
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
    const [request, options, configuration] = await IssuanceHelpers.createRequest(setup, 'siop');   
    
    let validationResponse: IDidValidationResponse = {
      status: 200,
      result: true,
      didKid: setup.defaulUserDidKid
    };    
    
    const validationOptions = new ValidationOptions(setup.validatorOptions, 'siop'); 
    
    const validator = new DidValidation(validationOptions);
    const response = await validator.validate(request.rawToken, setup.AUDIENCE, VerifiableCredentialConstants.TOKEN_SI_ISS);
    expect(response.result).toBeTruthy();
  });
});
