/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Subtle } from 'verifiablecredentials-crypto-sdk-typescript';
import TestSetup from './TestSetup';
import { DidDocument } from '@decentralized-identity/did-common-typescript';
import ClaimToken, { TokenType } from '../lib/verifiable_credential/ClaimToken';
import base64url from "base64url";
import ValidationOptions from '../lib/options/ValidationOptions';
import { KeyReference, IExpectedBase, IExpectedSelfIssued, IExpectedIdToken, IExpectedSiop, IExpectedVerifiablePresentation, IExpectedVerifiableCredential, Validator } from '../lib/index';
import VerifiableCredentialConstants from '../lib/verifiable_credential/VerifiableCredentialConstants';
import { stat } from 'fs';

export class IssuanceHelpers {
  public static readonly jti: string = 'testJti';

  /**
   * Create siop request
   */
  public static async createSiopRequestWithPayload(setup: TestSetup, siop: any, key: any): Promise<ClaimToken> {
    const claimToken = await IssuanceHelpers.signAToken(setup, JSON.stringify(siop), '', key);
    return claimToken;
  }

  /**
   * Create siop request
   */
  public static async createSiopRequest(setup: TestSetup, key: any, contract: string | undefined, nonce: string, attestations: any): Promise<ClaimToken> {
    const siop = {
      nonce,
      contract,
      attestations,
      iss: 'https://self-issued.me',
      aud: setup.AUDIENCE,
      jti: IssuanceHelpers.jti
    }

    return IssuanceHelpers.createSiopRequestWithPayload(setup, siop, key);
  }

  /**
   * Create a verifiable credentiaL
   * @param claims Credential claims
   */
  public static createSelfIssuedToken(claims: { [claim: string]: string }): ClaimToken {
    const header = base64url.encode(JSON.stringify({
      alg: "none",
      typ: 'JWT'
    }));
    const body = base64url.encode(JSON.stringify(claims));
    return new ClaimToken(TokenType.selfIssued, `${header}.${body}`, '');
  }

  /**
   * Create a verifiable credential
   * @param claims Token claims
   */
  public static async createVc(setup: TestSetup, credentialSubject: { [claim: string]: any }, configuration: string, jwkPrivate: any, jwkPublic: any): Promise<ClaimToken> {
    // Set the mock because we will resolve the signing key as did
    await this.resolverMock(setup, setup.defaultIssuerDid, jwkPrivate, jwkPublic);
    const statusUrl = 'https://portableidentitycards.azure-api.net/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/api/portable/v1.0/status';
    
    // Status mock
    setup.fetchMock.post(statusUrl, {}, { overwriteRoutes: true });
    console.log(`Set mock for ${statusUrl}`);

    let vcTemplate = {
      "jti": "urn:pic:80a509d2-99d4-4d6c-86a7-7b2636944080",
      "vc": {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://portableidentitycards.azure-api.net/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/api/portable/v1.0/contracts/test/schema"
        ],
        "type": [
          "VerifiableCredential",
          "DrivingLicense"
        ],
        "credentialSubject": {
        },
        "credentialStatus": {
          "id": `${statusUrl}`,
          "type": "PortableIdentityCardServiceCredentialStatus2020"
        }
      },
      iss: `${setup.defaultIssuerDid}`,
      sub: `${setup.defaultUserDid}`
    };
    vcTemplate.vc.credentialSubject = credentialSubject;
    return IssuanceHelpers.signAToken(setup, JSON.stringify(vcTemplate), configuration, jwkPrivate);
  }

  /**
   * Create a verifiable presentation
   * @param claims Token claims
   */
  public static async createVp(setup: TestSetup, vcs: ClaimToken[], jwkPrivate: any): Promise<ClaimToken> {
    let vpTemplate = {
      "jti": "baab2cdccb38408d8f1179071fe37dbe",
      "scope": "openid did_authn verify",
      "vp": {
        "@context": [
          "https://www.w3.org/2018/credentials/v1"
        ],
        "type": [
          "VerifiablePresentation"
        ],
        "verifiableCredential": []
      },
      iss: `${setup.defaultUserDid}`,
      aud: `${setup.defaultIssuerDid}`,
    };

    for (let inx = 0; inx < vcs.length; inx++) {
      (vpTemplate.vp.verifiableCredential as string[]).push(vcs[inx].rawToken);
    }
    return IssuanceHelpers.signAToken(setup, JSON.stringify(vpTemplate), '', jwkPrivate);
  }

  /**
   * Generate a signing keys and set the configuration mock
   */
  public static async generateSigningKey(_setup: TestSetup, kid: string): Promise<[any, any]> {
    const generator = new Subtle();
    const key: any = await generator.generateKey(
      <any>{
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: { name: "SHA-256" },
      },
      true,
      ["sign", "verify"]);
    const jwkPublic = await generator.exportKey('jwk', key.publicKey);

    const jwkPrivate = await generator.exportKey('jwk', key.privateKey);
    (<any>jwkPrivate).kid = (<any>jwkPublic).kid = kid;
    return [jwkPrivate, jwkPublic];
  }

  // Generate a signing keys and set the configuration mock
  public static async generateSigningKeyAndSetConfigurationMock(setup: TestSetup, kid: string, configuration?: string, issuer?: string): Promise<[any, any, string]> {
    // setup http mock
    configuration = configuration || setup.defaultIdTokenConfiguration;
    issuer = issuer || setup.tokenIssuer;
    const jwks = setup.defaultIdTokenJwksConfiguration
    setup.fetchMock.get(configuration, { "jwks_uri": `${jwks}`, "issuer": `${issuer}` }, { overwriteRoutes: true });
    console.log(`Set mock for ${configuration}`);
    const [jwkPrivate, jwkPublic] = await IssuanceHelpers.generateSigningKey(setup, kid);

    setup.fetchMock.get(jwks, `{"keys": [${JSON.stringify(jwkPublic)}]}`, { overwriteRoutes: true });
    console.log(`Set mock for ${jwks}`);
    return [jwkPrivate, jwkPublic, configuration];
  }

  // Set resolver mock
  public static async resolverMock(setup: TestSetup, did: string, jwkPrivate?: any, jwkPublic?: any): Promise<[DidDocument, any, any]> {
    // setup http mock
    if (!jwkPrivate && !jwkPublic) {
      [jwkPrivate, jwkPublic] = await IssuanceHelpers.generateSigningKey(setup, `${did}#signing`);
    }

    const didDocument = {
      didDocument: new DidDocument({
        "@context": "https://w3id.org/did/v1",
        id: did,
        publicKey: <any>[{
          id: jwkPublic.kid,
          type: 'RsaVerificationKey2018',
          controller: did,
          publicKeyJwk: jwkPublic
        }]
      })
    };
    (didDocument.didDocument as any)['@context'] = 'https://w3id.org/did/v1';

    // Resolver mock
    const resolverUrl = `${setup.resolverUrl}/${did}`;
    setup.fetchMock.get(resolverUrl, didDocument, { overwriteRoutes: true });
    console.log(`Set mock for ${resolverUrl}`);

    return [didDocument.didDocument, jwkPrivate, jwkPublic];
  }

  // Sign a token
  public static async signAToken(setup: TestSetup, payload: string, configuration: string, jwkPrivate: any): Promise<ClaimToken> {
    const keyId = new KeyReference(jwkPrivate.kid);
    await setup.keyStore.save(keyId, <any>jwkPrivate);
    setup.validatorOptions.crypto.builder.useSigningKeyReference(keyId);
    setup.validatorOptions.crypto.signingProtocol.builder.useKid(keyId.keyReference);
    const signature = await setup.validatorOptions.crypto.signingProtocol.sign(Buffer.from(payload));
    const token = setup.validatorOptions.crypto.signingProtocol.serialize();
    let claimToken = new ClaimToken(TokenType.idToken, token, configuration);
    return claimToken;
  }

  public static async createRequest(
    setup: TestSetup,
    tokenDescription: TokenType,
    issuance: boolean,
    idTokenIssuer?: string,
    idTokenAudience?: string,
    idTokenExp?: number): Promise<[ClaimToken, ValidationOptions, any]> {
    const options = new ValidationOptions(setup.validatorOptions, tokenDescription);
    const [didJwkPrivate, didJwkPublic] = await IssuanceHelpers.generateSigningKey(setup, setup.defaulUserDidKid);
    const [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid);
    const [didDocument, jwkPrivate2, jwkPublic2] = await IssuanceHelpers.resolverMock(setup, setup.defaultUserDid, didJwkPrivate, didJwkPublic);

    const idTokenPayload = {
      upn: 'jules@pulpfiction.com',
      name: 'Jules Winnfield',
      iss: idTokenIssuer ?? setup.tokenIssuer,
      aud: idTokenAudience ?? setup.tokenAudience,
      exp: idTokenExp ?? Math.trunc(Date.now() / 1000) + 10000,
    };

    const idToken = await IssuanceHelpers.signAToken(
      setup,
      JSON.stringify(idTokenPayload),
      tokenConfiguration,
      tokenJwkPrivate);

    const vcConfiguration = 'https://vcexample.com/schema';

    const vcPayload = {
      givenName: 'Jules',
      familyName: 'Winnfield'
    };
    const vc = await IssuanceHelpers.createVc(
      setup,
      vcPayload,
      vcConfiguration,
      tokenJwkPrivate,
      tokenJwkPublic);

    const vp = await IssuanceHelpers.createVp(setup, [vc], didJwkPrivate);
    const si = IssuanceHelpers.createSelfIssuedToken({ name: 'jules', birthDate: new Date().toString() });
    let attestations: { [claim: string]: any };
    if (issuance) {
      attestations = {
        selfIssued: si.rawToken,
        idTokens: {},
        presentations: {}
      };
      attestations.idTokens[setup.defaultIdTokenConfiguration] = idToken.rawToken;
      attestations.presentations['DrivingLicense'] = vp.rawToken;
     } else {
      attestations = {
        presentations: {}
      };
      attestations.presentations['DrivingLicense'] = vp.rawToken;
     }

    const contract = 'https://portableidentitycards.azure-api.net/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/api/portable/v1.0/contracts/test/schema';

    const request = await IssuanceHelpers.createSiopRequest(
      setup,
      didJwkPrivate,
      issuance ? contract : undefined,
      '',
      attestations
    );

    const vcContractIssuers: { [credentialType: string]: string[] } = {};
    vcContractIssuers['DrivingLicense'] = [setup.defaultIssuerDid];
    const idTokenConfiguration: string[] =[setup.defaultIdTokenConfiguration];
    const expected: IExpectedBase[] = [
      <IExpectedSelfIssued>{ type: TokenType.selfIssued },
      <IExpectedIdToken>{ type: TokenType.idToken, configuration: idTokenConfiguration, audience: setup.AUDIENCE },
      <IExpectedSiop>{ type: TokenType.siopIssuance, audience: setup.AUDIENCE },
      <IExpectedSiop>{ type: TokenType.siopPresentationAttestation, audience: setup.AUDIENCE },
      <IExpectedVerifiablePresentation>{ type: TokenType.verifiablePresentation, didAudience: setup.defaultIssuerDid },
      <IExpectedVerifiableCredential>{ type: TokenType.verifiableCredential, contractIssuers: vcContractIssuers }
    ];

    const siopRequest = {
      didJwkPrivate,
      didJwkPublic,
      tokenJwkPrivate,
      didDocument,
      contract,
      attestations,
      tokenConfiguration,
      idToken,
      vp,
      vc,
      si,
      expected,
      jti: IssuanceHelpers.jti
    }
    return [request, options, siopRequest];
  }

}