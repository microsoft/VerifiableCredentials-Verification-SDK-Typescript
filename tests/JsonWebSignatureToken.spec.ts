/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import base64url from 'base64url';
import { JsonWebSignatureToken, TokenPayload, ValidationError } from '../lib';

describe('JsonWebSignatureToken', () => {
  let knownJwt: string;
  let knownUnsecuredJwt: string;
  let header: TokenPayload;
  let payload: TokenPayload;
  let signature: string;

  beforeAll(() => {
    // test vector as defined in rfc https://tools.ietf.org/html/rfc7519#section-3.1
    knownJwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLCJleHAiOjEzMDA4MTkzODAsImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    knownUnsecuredJwt = knownJwt.substring(0, knownJwt.lastIndexOf('.') + 1);
    signature = knownJwt.substring(knownJwt.lastIndexOf('.') + 1);
    header = {
      typ: "JWT",
      alg: 'HS256',
    };

    payload = {
      iss: 'joe',
      exp: 1300819380,
      ['http://example.com/is_root']: true,
    };
  });

  describe('encode', () => {
    it('must encode input as jwt', () => {
      const token = JsonWebSignatureToken.encode(header, payload);
      expect(token.token).toEqual(knownUnsecuredJwt);
    });
  });

  describe('ctor', () => {
    it('must handle test vector', () => {
      const token = new JsonWebSignatureToken(knownJwt);
      expect(token.unsecured).toBeFalsy();
      expect(token.signature).toEqual(signature);
      expect(token.header).toEqual(header);
      expect(token.payload).toEqual(payload);
      expect(token['preimageLength']).toEqual(knownUnsecuredJwt.length - 1);
    });

    it('must handle unsecured jwt', () => {
      const token = new JsonWebSignatureToken(knownUnsecuredJwt);
      expect(token.unsecured).toEqual(true);
      expect(token.signature).toBeFalsy();
      expect(token.header).toEqual(header);
      expect(token.payload).toEqual(payload);
      expect(token['preimageLength']).toEqual(knownUnsecuredJwt.length - 1);
    });

    it('must reject unsecured jwt without trailing seperator', () => {
      try {
        new JsonWebSignatureToken(knownUnsecuredJwt.substring(0, knownUnsecuredJwt.length - 1));
        fail('error expected');
      } catch (error) {
        expect(error instanceof ValidationError).toBeTruthy();
      }
    });

    it('must reject malformed jwt without seperator', () => {
      try {
        new JsonWebSignatureToken('not a real token');
        fail('error expected');
      } catch (error) {
        expect(error instanceof ValidationError).toBeTruthy();
      }
    });

    it('must reject malformed header', () => {
      try {
        // this is not valid base64
        new JsonWebSignatureToken(`bad.${base64url.encode(JSON.stringify(payload))}.`);
        fail('error expected');
      } catch (error) {
        expect(error instanceof ValidationError).toBeTruthy();
      }
    });

    it('must reject malformed payload', () => {
      try {
        // not a valid json object
        new JsonWebSignatureToken(`${base64url.encode(JSON.stringify(header))}.aqab.`);
        fail('error expected');
      } catch (error) {
        expect(error instanceof ValidationError).toBeTruthy();
      }
    });
  });
});