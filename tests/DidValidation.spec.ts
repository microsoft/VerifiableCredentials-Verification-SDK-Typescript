/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import TestSetup from './TestSetup';
import { TokenType, IExpectedSiop } from '../lib/index';
import { IssuanceHelpers } from './IssuanceHelpers';
import { DidValidation } from '../lib/InputValidation/DidValidation';
import base64url from 'base64url';

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
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.siopIssuance, true);    
    const expected = siop.expected.filter((token: IExpectedSiop) => token.type === TokenType.siopIssuance)[0];

    const validator = new DidValidation(options, expected);
    let response = await validator.validate(request.rawToken);
    expect(response.result).toBeTruthy();
    
    // Negative cases
    // Bad VC signature
    response = await validator.validate(request.rawToken + 'a');
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The signature on the payload in the siopIssuance is invalid');

    // invalid format
    let tokenParts =  request.rawToken.split('.');
    response = await validator.validate(`.${tokenParts[1]}.${tokenParts[2]}`);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(400);
    expect(response.detailedError).toEqual('The siopIssuance could not be deserialized');

    // Token has no kid
    let header: any = {
      typ: 'JWT',
      alg: 'RS256'
    }
    tokenParts =  request.rawToken.split('.');
    response = await validator.validate(`${base64url.encode(JSON.stringify(header))}.${tokenParts[1]}.${tokenParts[2]}`);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The protected header in the siopIssuance does not contain the kid');

    // The kid has no did
    header = {
      typ: 'JWT',
      kid: 'abc',
      alg: 'RS256'
    }
    tokenParts =  request.rawToken.split('.');
    response = await validator.validate(`${base64url.encode(JSON.stringify(header))}.${tokenParts[1]}.${tokenParts[2]}`);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The kid in the protected header does not contain the DID. Required format for kid is <did>#kid');
  });
});
