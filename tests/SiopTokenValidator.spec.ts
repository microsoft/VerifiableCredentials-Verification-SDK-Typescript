/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IExpectedSiop, IssuanceHelpers, SiopTokenValidator, TokenType, ValidationOptions } from '../lib';
import ValidationQueue from '../lib/input_validation/ValidationQueue';
import TestSetup from './TestSetup';

describe('SiopTokenValidator', () => {
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
  });

  afterEach(() => {
    setup.fetchMock.reset();
  });


  it('should test nonce and state', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.siopIssuance, true);
    const expected: IExpectedSiop = siop.expected.filter((token: IExpectedSiop) => token.type === TokenType.siopIssuance)[0];
    
    let validator = new SiopTokenValidator(setup.validatorOptions, expected);
    let payload: any = {
      ...request.decodedToken,
      nonce: 'nonce',
      state: 'state'
    };
    let siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    let queue = new ValidationQueue();
    queue.enqueueToken('siop', siopRequest);
    let response = await validator.validate(queue, queue.getNextToken()!);
    expect(response.result).toBeTruthy();

    expected.nonce = 'nonce';
    expected.state = 'state';
    validator = new SiopTokenValidator(setup.validatorOptions, expected);
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    queue = new ValidationQueue();
    queue.enqueueToken('siop', siopRequest);
    const queudToken = queue.getNextToken();
    expect(queudToken?.isUnderValidation).toBeFalsy();
    response = await validator.validate(queue, queudToken!);
    expect(response.result).toBeTruthy();

    // negative cases
    // wrong state in response
    payload = {
      ...request.decodedToken,
      nonce: 'nonce',
      state: 'xxx'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    queue = new ValidationQueue();
    queue.enqueueToken('siop', siopRequest);
    response = await validator.validate(queue, queue.getNextToken()!);
    expect(response.result).toBeFalsy();
    expect(response.detailedError).toEqual(`Expect state 'state' does not match 'xxx'.`);

    // wrong state in response
    payload = {
      ...request.decodedToken,
      nonce: 'xxx',
      state: 'state'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    queue = new ValidationQueue();
    queue.enqueueToken('siop', siopRequest);
    response = await validator.validate(queue, queue.getNextToken()!);
    expect(response.result).toBeFalsy();
    expect(response.detailedError).toEqual(`Expect nonce 'nonce' does not match 'xxx'.`);

  });

});