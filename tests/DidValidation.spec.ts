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
  beforeEach(async () => {
    setup = new TestSetup();
    setup.fetchMock.reset();
  });
  
  afterEach(() => {
    setup.fetchMock.reset();
  });
  
  it('should test validate', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, 'siop');    
    
    const validator = new DidValidation(options, siop.expected);
    let response = await validator.validate(request.rawToken);
    expect(response.result).toBeTruthy();
    
    // Negative cases
    // Bad VC signature
    response = await validator.validate(request.rawToken + 'a');
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The signature on the payload in the siop is invalid');
  });
});
