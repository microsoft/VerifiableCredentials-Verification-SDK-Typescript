/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import ClaimToken, { TokenType } from '../lib/verifiable_credential/ClaimToken';
import base64url from 'base64url';
import VerifiableCredentialConstants from '../lib/verifiable_credential/VerifiableCredentialConstants';

describe('ClaimToken', () => {
  const sampleToken = 'thisIsAToken';
  let decodeSpy: jasmine.Spy<() => void>;

  beforeAll(() => {
    decodeSpy = spyOn((<any>ClaimToken).prototype, 'decode');
  });

  beforeEach(() => {
    decodeSpy.and.callThrough();
  });

  it('should create a ClaimToken', () => {
    const header = {typ: "JWT"};
    let payload = {name: 'test', vc: {}};
    let token = base64url.encode(JSON.stringify(header)) + '.' + base64url.encode(JSON.stringify(payload)) + '.';
    const configuration = 'https://configuration.example.com';
    let claimToken = new ClaimToken(TokenType.idToken, token, configuration);
    expect(claimToken.type).toEqual(TokenType.idToken);
    expect(claimToken.rawToken).toEqual(token);
    expect(claimToken.id).toEqual(configuration);
    expect(claimToken.decodedToken).toEqual(payload);
    expect(claimToken.tokenHeader).toEqual(header);
    claimToken = new ClaimToken(TokenType.siopIssuance, token, configuration);
    expect(claimToken.type).toEqual(TokenType.siopIssuance);
    claimToken = new ClaimToken(TokenType.siopPresentationAttestation, token, configuration);
    expect(claimToken.type).toEqual(TokenType.siopPresentationAttestation);
    claimToken = new ClaimToken(TokenType.siopPresentationExchange, token, configuration);
    expect(claimToken.type).toEqual(TokenType.siopPresentationExchange);
    claimToken = new ClaimToken(TokenType.verifiableCredential, token, configuration);
    expect(claimToken.type).toEqual(TokenType.verifiableCredential);
    claimToken = new ClaimToken(TokenType.verifiablePresentationJwt, token, configuration);
    expect(claimToken.type).toEqual(TokenType.verifiablePresentationJwt);
    delete (<any>payload).vc;
    token = base64url.encode(JSON.stringify(header)) + '.' + base64url.encode(JSON.stringify(payload)) + '.';
    claimToken = new ClaimToken(TokenType.selfIssued, token, configuration);
    expect(claimToken.type).toEqual(TokenType.selfIssued);
    claimToken = ClaimToken.create(claimToken.rawToken, '1');
    expect(claimToken.type).toEqual(TokenType.selfIssued);
    expect(claimToken.id).toEqual('1');
    
    claimToken.rawToken = '1';
    expect(claimToken.rawToken).toEqual('1');

    // negative cases
    expect(() => new ClaimToken(<any>'', token, configuration)).toThrowMatching((exception) => exception.message === `Type '' is not supported` && exception.code === 'VCSDKCLTO01');
    expect(() => new ClaimToken(TokenType.siopIssuance, 'token')).toThrowMatching((exception) => exception.message === `Cannot decode. Invalid input token` && exception.code === 'VCSDKCLTO06');
  });

  describe('create()', () => {
    const iss = VerifiableCredentialConstants.TOKEN_SI_ISS;
    let getTokenPayloadSpy: jasmine.Spy<(token: string) => any>;
    let payload: { [claim: string]: any } = {};

    beforeAll(() => {
      getTokenPayloadSpy = spyOn(<any>ClaimToken, 'getTokenPayload').withArgs(sampleToken);
      payload = { iss };
    });

    beforeEach(() => {
      decodeSpy.and.stub();
    });

    it('should create IdTokenHint type tokens', () => {
      // Mock payload creation.
      getTokenPayloadSpy.and.returnValue(payload);

      // IdTokenHint should be created.
      const expectedToken = new ClaimToken(TokenType.idTokenHint, sampleToken, VerifiableCredentialConstants.TOKEN_SI_ISS);
      expect(ClaimToken.create(sampleToken, VerifiableCredentialConstants.TOKEN_SI_ISS)).toEqual(expectedToken);
    });

    it('should create IdTokenHint type tokens with extraneous attestations claim', () => {
      // Mock payload creation.
      const extraneousAttestationsPayload = { ...payload, attestations: { selfIssued: { claim1: 'claimValue1' } } };
      getTokenPayloadSpy.and.returnValue(extraneousAttestationsPayload);

      // IdTokenHint should be created.
      const expectedToken = new ClaimToken(TokenType.idTokenHint, sampleToken, VerifiableCredentialConstants.TOKEN_SI_ISS);
      expect(ClaimToken.create(sampleToken, VerifiableCredentialConstants.TOKEN_SI_ISS)).toEqual(expectedToken);
    });

    it('should create IdTokenHint type tokens with extraneous contract claim', () => {
      // Mock payload creation.
      const extraneousContractPayload = { ...payload, contract: 'https://example.com/contract' };
      getTokenPayloadSpy.and.returnValue(extraneousContractPayload);

      // IdTokenHint should be created.
      const expectedToken = new ClaimToken(TokenType.idTokenHint, sampleToken, VerifiableCredentialConstants.TOKEN_SI_ISS);
      expect(ClaimToken.create(sampleToken, VerifiableCredentialConstants.TOKEN_SI_ISS)).toEqual(expectedToken);
    });

    it('should create IdTokenHint type tokens with extraneous presentation_submission claim', () => {
      // Mock payload creation.
      const extraneousPresentationSubmissionPayload = { ...payload, presentation_submission: 'presetnation submission' };
      getTokenPayloadSpy.and.returnValue(extraneousPresentationSubmissionPayload);

      // IdTokenHint should be created.
      const expectedToken = new ClaimToken(TokenType.idTokenHint, sampleToken, VerifiableCredentialConstants.TOKEN_SI_ISS);
      expect(ClaimToken.create(sampleToken, VerifiableCredentialConstants.TOKEN_SI_ISS)).toEqual(expectedToken);
    });
  });

  describe('getClaimTokensFromAttestations()', () => {
    let createSpy: jasmine.Spy<(token: string | object, id?: string) => ClaimToken>;

    beforeAll(() => {
      createSpy = spyOn(ClaimToken, 'create');
    });

    beforeEach(() => {
      decodeSpy.and.stub();
      createSpy.calls.reset();
      createSpy.and.stub();
    });

    it('should pass token key to create method', () => {
      const attestations: { [key: string]: string } = { idTokens: <any>{ [VerifiableCredentialConstants.TOKEN_SI_ISS]: sampleToken } };
      ClaimToken.getClaimTokensFromAttestations(attestations);
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledWith(sampleToken, VerifiableCredentialConstants.TOKEN_SI_ISS);
    });
  });
});
