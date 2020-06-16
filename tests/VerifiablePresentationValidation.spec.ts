/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { VerifiablePresentationValidation } from '../lib/InputValidation/VerifiablePresentationValidation';
import { IssuanceHelpers } from './IssuanceHelpers';
import ClaimToken, { TokenType } from '../lib/VerifiableCredential/ClaimToken';
import { Crypto, IExpectedVerifiablePresentation } from '../lib';

describe('VerifiablePresentationValidation', () => {

  let crypto: Crypto;
  let signingKeyReference: string;
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
    signingKeyReference = setup.defaulSigKey;
    crypto = setup.crypto
    await setup.generateKeys();
  });

  afterEach(() => {
    setup.fetchMock.reset();
  });

  it('should test validate', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiablePresentation, true);
    const expected = siop.expected.filter((token: IExpectedVerifiablePresentation) => token.type === TokenType.verifiablePresentation)[0];

    let validator = new VerifiablePresentationValidation(options, expected, setup.defaultUserDid, 'id', crypto);
    let response = await validator.validate(siop.vp.rawToken);
    expect(response.result).toBeTruthy();

    // Negative cases
    validator = new VerifiablePresentationValidation(options, expected, 'abcdef', 'id', crypto);
    response = await validator.validate(siop.vp.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong iss property in verifiablePresentation. Expected 'abcdef'`);

    // Bad VP signature
    response = await validator.validate(siop.vp.rawToken + 'a');
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The signature on the payload in the verifiablePresentation is invalid');

    // Missing iss
    let payload: any = {
    };
    let siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    validator = new VerifiablePresentationValidation(options, expected, setup.defaultUserDid, 'id', crypto);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing iss property in verifiablePresentation. Expected 'did:test:user'`);

    // Bad iss
     payload = {
      iss: 'test',
      vp: {}
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong iss property in verifiablePresentation. Expected 'did:test:user'`);


    // Missing aud
    payload = {
      iss: 'did:test:user',
      vp: {
        type: ['VerifiablePresentation'],
        verifiableCredential: {}
      }
    };
    payload.vp['@context'] = [];
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing aud property in verifiablePresentation. Expected 'did:test:issuer'`);

    // Wrong aud
    payload = {
      iss: 'did:test:user',
      aud: 'test',
      vp: {
        type: ['VerifiablePresentation'],
        verifiableCredential: {}
      }
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong aud property in verifiablePresentation. Expected 'did:test:issuer'`);

    // Missing context
    payload = {
      iss: 'did:test:user',
      aud: 'did:test:issuer',
      vp: {
      }
    };
    payload.vp['@context'] = [];
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing or wrong default type in vp of presentation. Should be VerifiablePresentation`);

    payload.vp['@context'].type = ['VerifiablePresentation'];
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing or wrong default type in vp of presentation. Should be VerifiablePresentation`);

    // Missing vc
    payload = {
      iss: 'did:test:user',
      aud: 'did:test:issuer',
      vp: {
        type: ['VerifiablePresentation']
      }
    };
    payload.vp['@context'] = [];
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing verifiableCredential in presentation`);

    // Missing vp
    payload = {
      iss: 'did:test:user',
      aud: 'did:test:issuer'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing vp in presentation`);

    // Missing context in vp
    payload = {
      iss: 'did:test:user',
      aud: 'did:test:issuer',
      vp: {}
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing @context in presentation`);


  });
});