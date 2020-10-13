/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import ClaimToken, { TokenType } from '../lib/verifiable_credential/ClaimToken';
import base64url from 'base64url';

 describe('ClaimToken', () => {
  it ('should create a ClaimToken', () => {
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
    claimToken = new ClaimToken(TokenType.verifiablePresentation, token, configuration);
    expect(claimToken.type).toEqual(TokenType.verifiablePresentation);
    delete payload.vc;
    token = base64url.encode(JSON.stringify(header)) + '.' + base64url.encode(JSON.stringify(payload)) + '.';
    claimToken = new ClaimToken(TokenType.selfIssued, token, configuration);
    expect(claimToken.type).toEqual(TokenType.selfIssued);
    claimToken = ClaimToken.create(claimToken.rawToken, '1');
    expect(claimToken.type).toEqual(TokenType.selfIssued);
    expect(claimToken.id).toEqual('1');
    
    claimToken.rawToken = '1';
    expect(claimToken.rawToken).toEqual('1');

    // negative cases
    expect(() => new ClaimToken(<any>'', token, configuration)).toThrowError(`Type '' is not supported`);
    expect(() => new ClaimToken(TokenType.siopIssuance, 'token')).toThrowError('Cannot decode. Invalid input token');
  });
 });