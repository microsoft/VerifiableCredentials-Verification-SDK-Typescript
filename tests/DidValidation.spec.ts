/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import TestSetup from './TestSetup';
import { TokenType, IExpectedSiop, ValidatorBuilder } from '../lib/index';
import { IssuanceHelpers } from './IssuanceHelpers';
import { DidValidation } from '../lib/input_validation/DidValidation';
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
    let response = await validator.validate(<string>request.rawToken);
    expect(response.result).toBeTruthy();
    
    // Negative cases
    // Bad VC signature
    response = await validator.validate(request.rawToken + 'a');
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('The signature on the payload in the siopIssuance is invalid');
    expect(response.code).toEqual('VCSDKVaHe27');

    // invalid format
    let tokenParts =  (<string>request.rawToken).split('.');
    response = await validator.validate(`.${tokenParts[1]}.${tokenParts[2]}`);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('The siopIssuance could not be deserialized');
    expect(response.code).toEqual('VCSDKVaHe01');

    // Token has no kid
    let header: any = {
      typ: 'JWT',
      alg: 'RS256'
    }
    tokenParts =  (<string>request.rawToken).split('.');
    response = await validator.validate(`${base64url.encode(JSON.stringify(header))}.${tokenParts[1]}.${tokenParts[2]}`);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('The protected header in the siopIssuance does not contain the kid');
    expect(response.code).toEqual('VCSDKVaHe05');

    // The kid has no did
    header = {
      typ: 'JWT',
      kid: 'abc',
      alg: 'RS256'
    }
    tokenParts =  (<string>request.rawToken).split('.');
    response = await validator.validate(`${base64url.encode(JSON.stringify(header))}.${tokenParts[1]}.${tokenParts[2]}`);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(401);
    expect(response.detailedError).toEqual('The kid in the protected header does not contain the DID. Required format for kid is <did>#kid');
    expect(response.code).toEqual('VCSDKDIDV01');

    // failing token time
    options.checkTimeValidityOnTokenDelegate= () => {
      return <any>{ result: false, detailedError: 'checkTimeValidityOnTokenDelegate error'};
    }
    response = await validator.validate(<string>request.rawToken);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('checkTimeValidityOnTokenDelegate error');

    // failing resolveDidAndGetKeysDelegate
    options.resolveDidAndGetKeysDelegate = () => {
      return <any>{ result: false, detailedError: 'resolveDidAndGetKeysDelegate error'};
    }
    response = await validator.validate(<string>request.rawToken);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('resolveDidAndGetKeysDelegate error');

    // failing did kid
    options.getTokenObjectDelegate = () => {
      return <any>{ result: true, didKid: '#did#kid'};
    }
    response = await validator.validate(<string>request.rawToken);
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('The kid does not contain the DID');
    expect(response.code).toEqual('VCSDKDIDV02');

    // failing DID resolve
    setup.fetchMock.reset();
    const resolverUrl = `${setup.resolverUrl}/abc`;
    setup.fetchMock.get(resolverUrl, {status: 404, response: {}});
    response = await options.resolveDidAndGetKeysDelegate(<any>{did: 'abc'});
    expect(response.result).toBeFalsy();


});
});
