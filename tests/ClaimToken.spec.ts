/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import ClaimToken, { TokenType } from '../lib/verifiable_credential/ClaimToken';
import VerifiableCredentialConstants from '../lib/verifiable_credential/VerifiableCredentialConstants';
import JsonWebSignatureToken, { TokenPayload } from '../lib/verifiable_credential/JsonWebSignatureToken';
import { exec } from 'child_process';

describe('ClaimToken', () => {
  const HEADER = { typ: "JWT", alg: "none" };

  it('should create a ClaimToken', () => {
    let payload = { name: 'test', vc: {} };
    let { token } = JsonWebSignatureToken.encode(HEADER, payload);
    const configuration = 'https://configuration.example.com';
    let claimToken = new ClaimToken(TokenType.idToken, token, configuration);
    expect(claimToken.type).toEqual(TokenType.idToken);
    expect(claimToken.rawToken).toEqual(token);
    expect(claimToken.id).toEqual(configuration);
    expect(claimToken.decodedToken).toEqual(payload);
    expect(claimToken.tokenHeader).toEqual(HEADER);
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
    token = JsonWebSignatureToken.encode(HEADER, payload).token;
    claimToken = new ClaimToken(TokenType.selfIssued, token, configuration);
    expect(claimToken.type).toEqual(TokenType.selfIssued);

    // self issued claims are an object passed in the attestations
    claimToken = ClaimToken.create(claimToken.decodedToken, '1');
    expect(claimToken.type).toEqual(TokenType.selfIssued);
    expect(claimToken.id).toEqual('1');

    claimToken.rawToken = '1';
    expect(claimToken.rawToken).toEqual('1');

    // negative cases
    expect(() => new ClaimToken(<any>'', token, configuration)).toThrowMatching((exception) => exception.message === `Type '' is not supported` && exception.code === 'VCSDKCLTO01');
    expect(() => new ClaimToken(TokenType.siopIssuance, 'token')).toThrowMatching((exception) => exception.message === 'Invalid json web token' && exception.code === 'VCSDKJWST01');
  });

  describe('create()', () => {
    const iss = VerifiableCredentialConstants.TOKEN_SI_ISS;
    let payload: TokenPayload = {};

    function executeCreateIdTokenHintTest(tokenPayload: TokenPayload) {
      const jwt = JsonWebSignatureToken.encode(HEADER, tokenPayload);
      const expectedToken = new ClaimToken(TokenType.idTokenHint, jwt, VerifiableCredentialConstants.TOKEN_SI_ISS);
      expect(ClaimToken.create(jwt.token, VerifiableCredentialConstants.TOKEN_SI_ISS)).toEqual(expectedToken);
    }

    beforeAll(() => {
      payload = { iss };
    });

    it('should create IdTokenHint type tokens', () => {
      // IdTokenHint should be created.
      executeCreateIdTokenHintTest(payload);
    });

    it('should create IdTokenHint type tokens with extraneous attestations claim', () => {
      // Mock payload creation.
      const extraneousAttestationsPayload = { ...payload, attestations: { selfIssued: { claim1: 'claimValue1' } } };

      // IdTokenHint should be created.
      executeCreateIdTokenHintTest(extraneousAttestationsPayload);
    });

    it('should create IdTokenHint type tokens with extraneous contract claim', () => {
      // Mock payload creation.
      const extraneousContractPayload = { ...payload, contract: 'https://example.com/contract' };

      // IdTokenHint should be created.
      executeCreateIdTokenHintTest(extraneousContractPayload);
    });

    it('should create IdTokenHint type tokens with extraneous presentation_submission claim', () => {
      // Mock payload creation.
      const extraneousPresentationSubmissionPayload = { ...payload, presentation_submission: 'presentation submission' };

      // IdTokenHint should be created.
      executeCreateIdTokenHintTest(extraneousPresentationSubmissionPayload);
    });
  });

  describe('getClaimTokensFromAttestations()', () => {
    it('should pass token key to create method', () => {
      const idTokenHint = JsonWebSignatureToken.encode(HEADER, { test: true });
      const attestations: { [key: string]: string } = { idTokens: <any>{ [VerifiableCredentialConstants.TOKEN_SI_ISS]: idTokenHint.token } };
      const { [VerifiableCredentialConstants.TOKEN_SI_ISS]: idTokenHintClaimToken } = ClaimToken.getClaimTokensFromAttestations(attestations);
      expect(idTokenHintClaimToken.decodedToken).toBeDefined();
      expect(idTokenHintClaimToken.decodedToken.test).toBeTruthy();
    });
  });
});
