/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IssuanceHelpers } from './IssuanceHelpers';
import { ManagedHttpResolver, CryptoBuilder, IKeyStore, SubtleCryptoNode, KeyReference, ValidationSafeguards } from '../lib/index';
import IValidatorOptions from '../lib/options/IValidatorOptions';
import FetchRequest from '../lib/tracing/FetchRequest';

/**
 * Class that creates resources needed for unit tests
 */
export default class TestSetup {
  /**
   * Test audience
   */
  public AUDIENCE = 'https://portableidentitycards.azure-api.net/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/api/portable/v1.0/card/issue';

  /**
   * Http mock
   */
  public fetchMock = require('fetch-mock');

  /**
   * Resolver url
   */
  public resolverUrl = `https://beta.discover.did.msidentity.com/1.0/identifiers`;

  /**
   * TestSetup environment
   */
  public resolver = new ManagedHttpResolver(this.resolverUrl);

  /**
   * Constant for default id token configuration
   */
  public defaultIdTokenConfiguration = 'http://example/configuration';

  /**
   * Constant for default id token jwks configuration
   */
  public defaultIdTokenJwksConfiguration = 'http://example/jwks';

  /**
   * Constant for the default user did
   */
  public defaultUserDid = 'did:test:user';

  /**
   * Constant for the default issuer did
   */
  public defaultIssuerDid = 'did:test:issuer';

  /**
   * Constant for default kid for user DID
   */
  public defaulSigKey = new KeyReference('signing');

  /**
   * Constant for default kid for user DID
   */
  public defaulUserDidKid = `${this.defaultUserDid}#${this.defaulSigKey.keyReference}`;

  /**
   * Constant for default kid for issuer DID
   */
  public defaulIssuerDidKid = `${this.defaultIssuerDid}#${this.defaulSigKey.keyReference}`;

  /**
   * Constant for token audience
   */
  public tokenAudience = 'https://portableidentitycards.azure-api.net/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/api/portable/v1.0/card/issue';

  /**
   * Constant for token issuer url
   */
  public tokenIssuer = 'https://example.com/issuer';

  /**
   * SubtleCrypto instance
   */
  public defaultSubtleCrypto: SubtleCrypto = new SubtleCryptoNode().getSubtleCrypto();

  /**
   * CryptoFactory instance
   */
  public crypto = new CryptoBuilder()
    .useDid(this.defaultIssuerDid)
    .useSigningKeyReference(this.defaulSigKey)
    .build();

  /**
   * TestSetup crypto properties
   */
  public keyStore: IKeyStore = this.crypto.builder.keyStore;

  /**
  * Validator options
  */
  public validatorOptions: IValidatorOptions = {
    fetchRequest: new FetchRequest(),
    validationSafeguards: new ValidationSafeguards(),
    resolver: this.resolver,
    crypto: this.crypto,
    invalidTokenError: 401,
  };

  /**
   * Set the keys
   */
  public keys = [
    { kid: `${this.defaulSigKey}`, didKid: `${this.defaultUserDid}#${this.defaulSigKey}`, kty: 'EC', use: 'sig', alg: 'ES256K', extractable: true }
  ];

  /**
   * test input request
   */
  public body = {
    did: 'did:ion:test:EiCAvQuaAu5awq_e_hXyJImdQ5-xJsZzzQ3Xd9a2EAphtQ',
    sub: 'g-MLz0YqN0d84md1wNUOaxCZdT8OEUlalGDla38H32o',
    sub_jwk: {
      defaultSignAlgorithm: 'ES256K',
      crv: 'P-256K',
      x: 'AU-WZrK8O_rx4wlq3idyuFlvACM_sMXZputpkzyHPMk',
      y: 'qOpL6upm2RSrwrTBbUvL_4xYnSTdSFLtjOlQlJ74pt0',
      alg: 'ES256K',
      kid: `did:ion:test:EiCAvQuaAu5awq_e_hXyJImdQ5-xJsZzzQ3Xd9a2EAphtQ#${this.defaulSigKey}`,
      kty: 'EC',
      use: 'verify'
    },
    nonce: 'MArbHaFnEUKsxsBXgFvoPg',
    schema: 'http://localhost:7071/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/contracts/test/schema',
    claims: {
      _claim_names: {
        'name': 'selfIssued',
        'https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47/.well-known/openid-configuration': 'idtoken1'
      },
      _claim_sources: {
        selfIssued: {
          JWT: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJuYW1lIjoiSm9leSBKb2pvIEp1bmlvciBTaGFiYWRvbyJ9'
        },
        idtoken1: {
          // tslint:disable-next-line:max-line-length
          JWT: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IkhsQzBSMTJza3hOWjFXUXdtak9GXzZ0X3RERSIsImtpZCI6IkhsQzBSMTJza3hOWjFXUXdtak9GXzZ0X3RERSJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuYXp1cmUuY29tLyIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0Ny8iLCJpYXQiOjE1ODI1ODI4NzEsIm5iZiI6MTU4MjU4Mjg3MSwiZXhwIjoxNTgyNTg2NzcxLCJfY2xhaW1fbmFtZXMiOnsiZ3JvdXBzIjoic3JjMSJ9LCJfY2xhaW1fc291cmNlcyI6eyJzcmMxIjp7ImVuZHBvaW50IjoiaHR0cHM6Ly9ncmFwaC53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvdXNlcnMvZWQ3YmM3MTctMjc4Ni00ZWQ1LTljYjItOTlmNzIwNTFlNTM1L2dldE1lbWJlck9iamVjdHMifX0sImFjciI6IjEiLCJhaW8iOiJBVlFBcS84T0FBQUFmdEFta2doSjV5YmtxUWtpaGNpZ0w0OWUzOFhuVzZ5U1N3a1g2dGxqb3p4LzQ4bHd2b3hsNVNjQ3pORE1peGFJQU1kdkpYSDl6RGx4elQ2dDQ1UUh6Vm1XTDJKY1NkSG11NWk3c1RMYXBSST0iLCJhbXIiOlsicnNhIiwibWZhIl0sImFwcGlkIjoiMDRiMDc3OTUtOGRkYi00NjFhLWJiZWUtMDJmOWUxYmY3YjQ2IiwiYXBwaWRhY3IiOiIwIiwiZGV2aWNlaWQiOiJhYzg5MTk0NC05YTU0LTQ5ZTYtYWNlMi01YmRmMzI2N2U0ZjYiLCJmYW1pbHlfbmFtZSI6IkJqb25lcyIsImdpdmVuX25hbWUiOiJSb25ueSIsImlwYWRkciI6IjEzMS4xMDcuMTQ3LjE2OCIsIm5hbWUiOiJSb25ueSBCam9uZXMiLCJvaWQiOiJlZDdiYzcxNy0yNzg2LTRlZDUtOWNiMi05OWY3MjA1MWU1MzUiLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMTcyMTI1NDc2My00NjI2OTU4MDYtMTUzODg4MjI4MS0yNDExODYyIiwicHVpZCI6IjEwMDNCRkZEODAxQzk3QjQiLCJzY3AiOiJ1c2VyX2ltcGVyc29uYXRpb24iLCJzdWIiOiJISTNZbExaOUFXUmNBZC11aHNUQW1lYzlJTzhpLU5jQWR5ZkpxN0VxbFVvIiwidGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IiwidW5pcXVlX25hbWUiOiJyb25ueWJqQG1pY3Jvc29mdC5jb20iLCJ1cG4iOiJyb25ueWJqQG1pY3Jvc29mdC5jb20iLCJ1dGkiOiJwYlc5OVhONXMwQzJ0MjJmRDBvQUFBIiwidmVyIjoiMS4wIn0.j-kLZ7BXAE3lKTO3hAS32Jl8cIsQBBO46WbXw8pvtIsi1owzMJ8lXFH6ysFHD4UD1NZPWg1NWL2F6jp6762STP_56ABIMifBtvNbOq2985u6GJrMTttT1mo4-auN6EESmMjdy7POiMxELnhLvAJkUx-fy3Xh-koBOPc3ekvuuZHLF3L67ITtzFBEjq7tWUiXpY3KJ1KHYkM6vMk1sjLbLf2BB-Q463M3QKIak258k_5VxMXi1kaku4_a4CEe626zUpX53WMH54MOEu7F4Q1wKdsKcATh6sqRSdU5ua05mE6VRxYiBs1wwnfHJOvc0ss45ate3Rh4a0XAlRU-He1vjg'
        }
      }
    },
    jti: 'ce14a510933c443688fcbebe0cdb88b3',
    aud: 'http://localhost:7071/v2/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/card/issue',
    iss: 'https://self-issued.me',
    iat: 1582583444,
    exp: 4582583444
  };

  /**
   * Create keys for tests
   */
  public async generateKeys() {
    for (let inx = 0; inx < this.keys.length; inx++) {
      const kid = this.keys[inx].kid;
      const didKid = this.keys[inx].didKid;

      // generate the keys
      const [didJwkPrivate, didJwkPublic] = await IssuanceHelpers.generateSigningKey(this, didKid);
      const [didDocument, jwkPrivate, jwkPublic] = await IssuanceHelpers.resolverMock(this, this.defaultUserDid, didJwkPrivate, didJwkPublic);
      await this.keyStore.save(new KeyReference(kid), jwkPrivate);
    }
  }
}
