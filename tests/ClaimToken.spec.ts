/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import ClaimToken, { TokenType } from '../lib/VerifiableCredential/ClaimToken';
import base64url from "base64url";

 describe('ClaimToken', () => {
  it('should extract ClaimTokens from claim sources in getClaimTokensFromClaimSources', async () => {
    const claimSources: {[key: string]: { JWT: string }} = {
      'http://example1.com': { JWT: `${base64url.encode('{"header": "h1"}')}.${base64url.encode('{"JWT": "token1"}')}`},
      'vp1': { JWT: `${base64url.encode('{"header": "h1"}')}.${base64url.encode('{"JWT": "vc1"}')}`},
      'selfIssued': { JWT: `${base64url.encode('{"header": "h1"}')}.${base64url.encode('{"JWT": "self"}')}`},
      'http://example2.com': { JWT: `${base64url.encode('{"header": "h2"}')}.${base64url.encode('{"JWT": "token2"}')}`},
      'vp2': { JWT: `${base64url.encode('{"header": "h2"}')}.${base64url.encode('{"JWT": "vc2"}')}`}
    };

    const claimNames: { [key: string]: string } = {
      'birthDate': 'selfIssued',
      'https://vcexample1.com/schema#vc.credentialSubject.familyName': 'vp1',
      'name': 'http://example1.com',
      'https://vcexample2.com/schema#vc.credentialSubject.givenName': 'vp2',
      'test': 'http://example2.com',
      'https://vcexample1.com/schema#vc.credentialSubject.familyName2': 'vp1',
      'name2': 'http://example1.com',
      'https://vcexample2.com/schema#vc.credentialSubject.givenName2': 'vp2',
      'test2': 'http://example2.com',
      'email': 'selfIssued'
    };

    const tokens = ClaimToken.getClaimTokensFromClaimSources(claimSources, claimNames);
    expect(tokens[0].configuration).toEqual('http://example1.com');
    expect(tokens[0].type).toEqual(TokenType.idToken);
    expect(tokens[0].rawToken).toEqual(`${base64url.encode('{"header": "h1"}')}.${base64url.encode('{"JWT": "token1"}')}`);
    expect(tokens[1].configuration).toEqual('https://vcexample1.com/schema');
    expect(tokens[1].type).toEqual(TokenType.verifiablePresentation);
    expect(tokens[1].rawToken).toEqual(`${base64url.encode('{"header": "h1"}')}.${base64url.encode('{"JWT": "vc1"}')}`);
    expect(tokens[2].configuration).toEqual('selfIssued');
    expect(tokens[2].type).toEqual(TokenType.selfIssued);
    expect(tokens[2].rawToken).toEqual(`${base64url.encode('{"header": "h1"}')}.${base64url.encode('{"JWT": "self"}')}`);
    expect(tokens[3].configuration).toEqual('http://example2.com');
    expect(tokens[3].type).toEqual(TokenType.idToken);
    expect(tokens[3].rawToken).toEqual(`${base64url.encode('{"header": "h2"}')}.${base64url.encode('{"JWT": "token2"}')}`);
    expect(tokens[4].configuration).toEqual('https://vcexample2.com/schema');
    expect(tokens[4].type).toEqual(TokenType.verifiablePresentation);
    expect(tokens[4].rawToken).toEqual(`${base64url.encode('{"header": "h2"}')}.${base64url.encode('{"JWT": "vc2"}')}`);
  });
  it('should return no tokens with empty claim source', async () => {
    const claimSources: {[key: string]: { JWT: string }} = {
    };

    const claimNames: { [key: string]: string } = {
      'birthDate': 'selfIssued',
      'https://vcexample1.com/schema#vc.credentialSubject.familyName': 'vp1',
      'name': 'http://example1.com',
      'https://vcexample2.com/schema#vc.credentialSubject.givenName': 'vp2',
      'test': 'http://example2.com',
      'https://vcexample1.com/schema#vc.credentialSubject.familyName2': 'vp1',
      'name2': 'http://example1.com',
      'https://vcexample2.com/schema#vc.credentialSubject.givenName2': 'vp2',
      'test2': 'http://example2.com',
      'email': 'selfIssued'
    };

    const tokens = ClaimToken.getClaimTokensFromClaimSources(claimSources, claimNames);
    expect(tokens.length).toEqual(0);
  });  
  it('should throw with empty claim names', async () => {
    const claimSources: {[key: string]: { JWT: string }} = {
      'http://example1.com': { JWT: `${base64url.encode('{"header": "h1"}')}.${base64url.encode('{"JWT": "token1"}')}`},
      'vp1': { JWT: `${base64url.encode('{"header": "h1"}')}.${base64url.encode('{"JWT": "vc1"}')}`},
      'selfIssued': { JWT: `${base64url.encode('{"header": "h1"}')}.${base64url.encode('{"JWT": "self"}')}`},
      'http://example2.com': { JWT: `${base64url.encode('{"header": "h2"}')}.${base64url.encode('{"JWT": "token2"}')}`},
      'vp2': { JWT: `${base64url.encode('{"header": "h2"}')}.${base64url.encode('{"JWT": "vc2"}')}`}
    };

    const claimNames: { [key: string]: string } = {
    };

    let throwed = false;
    try {
      ClaimToken.getClaimTokensFromClaimSources(claimSources, claimNames);
    } catch (err) {
      throwed = true;
    }
    expect(throwed).toBeTruthy();
  });
 });