/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { VerifiablePresentationValidation } from '../lib/input_validation/VerifiablePresentationValidation';
import { IssuanceHelpers } from './IssuanceHelpers';
import { TokenType } from '../lib/verifiable_credential/ClaimToken';
import { Crypto, IExpectedVerifiablePresentation } from '../lib';
import { KeyReference } from 'verifiablecredentials-crypto-sdk-typescript';

describe('VerifiablePresentationValidation', () => {

  let crypto: Crypto;
  let signingKeyReference: KeyReference;
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
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiablePresentationJwt, true);
    const expected = siop.expected.filter((token: IExpectedVerifiablePresentation) => token.type === TokenType.verifiablePresentationJwt)[0];

    let validator = new VerifiablePresentationValidation(options, expected, setup.defaultUserDid, 'id');
    let response = await validator.validate(siop.vp.rawToken);
    expect(response.result).toBeTruthy();

    // Negative cases

    validator = new VerifiablePresentationValidation(options, expected, 'abcdef', 'id');
    response = await validator.validate(siop.vp.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong iss property in verifiablePresentation. Expected 'abcdef'`);
    expect(response.code).toEqual('VCSDKVaHe18');

    // Bad VP signature
    response = await validator.validate(siop.vp.rawToken + 'a');
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The signature on the payload in the verifiablePresentationJwt is invalid');
    expect(response.code).toEqual('VCSDKVaHe27');

    // Missing iss
    let payload: any = {
    };
    let siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    validator = new VerifiablePresentationValidation(options, expected, setup.defaultUserDid, 'id');
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing iss property in verifiablePresentation. Expected 'did:test:user'`);
    expect(response.code).toEqual('VCSDKVaHe17');

    // Bad iss
     payload = {
      iss: 'test',
      vp: {}
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong iss property in verifiablePresentation. Expected 'did:test:user'`);
    expect(response.code).toEqual('VCSDKVaHe18');

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
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing aud property in verifiablePresentation. Expected 'did:test:issuer'`);
    expect(response.code).toEqual('VCSDKVaHe19');

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
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong aud property in verifiablePresentation. Expected 'did:test:issuer'. Found 'test'`);
    expect(response.code).toEqual('VCSDKVaHe20');

    // Missing context
    payload = {
      iss: 'did:test:user',
      aud: 'did:test:issuer',
      vp: {
      }
    };
    payload.vp['@context'] = [];
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing or wrong default type in vp of presentation. Should be VerifiablePresentation`);
    expect(response.code).toEqual('VCSDKVPVa03');

    payload.vp['@context'].type = ['VerifiablePresentation'];
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing or wrong default type in vp of presentation. Should be VerifiablePresentation`);
    expect(response.code).toEqual('VCSDKVPVa03');

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
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing verifiableCredential in presentation`);
    expect(response.code).toEqual('VCSDKVPVa04');

    // Missing vp
    payload = {
      iss: 'did:test:user',
      aud: 'did:test:issuer'
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing vp in presentation`);
    expect(response.code).toEqual('VCSDKVPVa02');

    // Missing context in vp
    payload = {
      iss: 'did:test:user',
      aud: 'did:test:issuer',
      vp: {}
    };
    siopRequest = await IssuanceHelpers.createSiopRequestWithPayload(setup, payload, siop.didJwkPrivate);
    response = await validator.validate(<string>siopRequest.rawToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Missing @context in presentation`);
    expect(response.code).toEqual('VCSDKVPVa03');


    // wrong did
    const checkScopeValidityOnVpTokenSpy = spyOn(options, 'checkScopeValidityOnVpTokenDelegate').and.callFake(() => {
      return <any>{
        result: true,
        did: 'wrong did'
      }
    });

    validator = new VerifiablePresentationValidation(options, expected, setup.defaultUserDid, 'id');
    response = await validator.validate(siop.vp.rawToken);
    expect(response.detailedError).toEqual(`The DID used for the SIOP did:test:user is not equal to the DID used for the verifiable presentation wrong did`);
    expect(response.code).toEqual('VCSDKVPVa01');
  });
});