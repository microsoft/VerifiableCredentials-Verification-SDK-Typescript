/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AuthenticationModel, AuthenticationScheme, BaseAttestationModel, DataProviderModel, EventBindingModel, IdTokenAttestationModel, InputClaimModel, InputModel, IssuanceAttestationsModel, RefreshConfigurationModel, RemoteKeyAuthorizationModel, RemoteKeyModel, RulesModel, RulesPermissionModel, RulesValidationError, SelfIssuedAttestationModel, TransformModel, TrustedIssuerModel, VerifiableCredentialModel, VerifiablePresentationAttestationModel } from '../lib';

describe('RulesModel', () => {
  let RULES: any;
  let AUTH: AuthenticationModel;
  const TestHeader = 'header';

  function validateAuthenticationModel(expected: AuthenticationModel, test: AuthenticationModel) {
    expect(test.header).toEqual(expected.header);
    expect(test.type).toEqual(expected.type);
    expect(test.secret).toEqual(expected.secret);
  }

  beforeEach(() => {
    AUTH = new AuthenticationModel(AuthenticationScheme.sharedSecret, 'test', 'test');
    RULES = new RulesModel(
      'issuer uri',
      'issuer',
      new IssuanceAttestationsModel(
        new SelfIssuedAttestationModel(
          {
            alias: new InputClaimModel('name', 'string', false, true, new TransformModel('name', 'remote'))
          },
          false,
          undefined,
          true
        ),
        [
          new VerifiablePresentationAttestationModel(
            'CredentialType',
            5 * 60,
            [
              new TrustedIssuerModel('trusted issuer 1'),
              new TrustedIssuerModel('trusted issuer 2')
            ],
            [
              new TrustedIssuerModel('endorser')
            ],
            [
              'contract'
            ],
            {
              givenName: new InputClaimModel('vc.credentialSubject.givenName'),
              familyName: new InputClaimModel('vc.credentialSubject.familyName', 'string', true)
            })
        ],
        [
          new IdTokenAttestationModel(
            'oidc config endpoint',
            'clientId',
            'redirect',
            'scope',
            {
              email: new InputClaimModel('upn', 'string', false, true),
              name: new InputClaimModel('name')
            }
          ),
        ]),
      86400,
      [
        new RemoteKeyModel(undefined, undefined, 'x5t', 'pfx', true, new RemoteKeyAuthorizationModel('msi')),
        new RemoteKeyModel('kid', 'key', undefined, undefined, true, new RemoteKeyAuthorizationModel('msi')),
      ],
      [
        new RemoteKeyModel('kid', 'key', undefined, undefined, false, new RemoteKeyAuthorizationModel('msi')),
      ],
      new RefreshConfigurationModel(604800),
      true,
      true,
      new VerifiableCredentialModel(
        ['urn:test:context'],
        ['EmployeeCredential'],
        {
          put: {
            an: 'object',
            here: true
          }
        },
      ),
      true,
      [
        new TrustedIssuerModel('end1')
      ],
      undefined,
      AUTH,
    );


    /**
     * in order to test that the authentication object in rules can cascade down to DataProviderModel instances,
     * since DataProvider.authentication cannot be undefined, there's no way to set it in a ctor, so it has to be removed after the fact
     */    
    const eventBindings = new EventBindingModel();
    eventBindings.onTokenAugmentation = new DataProviderModel('test', AUTH, { 'test': TestHeader }, 100);
    const json = JSON.parse(JSON.stringify(eventBindings));
    json.onTokenAugmentation.authentication = undefined;
    RULES.eventBindings = JSON.parse(JSON.stringify(json));
  });

  // tslint:disable-next-line:max-func-body-length
  describe('RulesModel class serialization', () => {
    it('Rules model must roundtrip ', () => {
      const json = JSON.stringify(RULES);
      const roundtrip = new RulesModel();
      roundtrip.populateFrom(JSON.parse(json));

      expect(roundtrip.credentialIssuer).toEqual(RULES.credentialIssuer);
      expect(roundtrip.issuer).toEqual(RULES.issuer);
      expect(roundtrip.validityInterval).toEqual(RULES.validityInterval);
      expect(roundtrip.statusCheckDisabled).toEqual(RULES.statusCheckDisabled);
      expect(roundtrip.clientRevocationDisabled).toEqual(RULES.clientRevocationDisabled);

      // check endorsers
      const rulesEndorsers = <TrustedIssuerModel[]>RULES.endorsers;
      const roundtripEndorsers = <TrustedIssuerModel[]>roundtrip.endorsers;
      expect(roundtripEndorsers[0].iss).toEqual(rulesEndorsers[0].iss);

      // check the refresh values
      const roundtripRefresh = <RefreshConfigurationModel>roundtrip.refresh;
      const rulesRefresh = <RefreshConfigurationModel>RULES.refresh;
      expect(roundtripRefresh).toBeDefined();
      expect(rulesRefresh).toBeDefined();
      expect(roundtripRefresh.validityInterval).toEqual(rulesRefresh.validityInterval);
      expect(roundtrip.minimalDisclosure).toBeTruthy();

      // make sure mapping serializes
      const roundtripSelfIssued = <SelfIssuedAttestationModel>roundtrip.attestations?.selfIssued;
      const rulesSelfIssuedAttestation = <SelfIssuedAttestationModel>RULES.attestations?.selfIssued;
      const roundtripSelfIssuedMapping = <any>roundtripSelfIssued.mapping;
      expect(roundtripSelfIssued).toBeDefined();
      expect(roundtripSelfIssuedMapping).toBeDefined();
      expect(roundtripSelfIssued.required).toEqual(rulesSelfIssuedAttestation.required);
      expect(Object.keys(roundtripSelfIssuedMapping).length).toEqual(Object.keys(<any>RULES.attestations?.selfIssued?.mapping).length);
      // when id is not specified, it's the same as the name
      expect((<BaseAttestationModel>roundtripSelfIssued).id).toEqual((<BaseAttestationModel>roundtripSelfIssued).name);

      // analyze the contents of input claim
      const roundtripAlias = <InputClaimModel>roundtrip.attestations?.selfIssued?.mapping?.alias;
      const rulesAlias = <InputClaimModel>RULES.attestations?.selfIssued?.mapping?.alias;
      expect(roundtripAlias).toBeDefined();
      expect(roundtripAlias.indexed).toBeTruthy();

      const roundtripTransform = <TransformModel>roundtripAlias.transform;
      expect(roundtripTransform).toBeDefined();
      expect(roundtripTransform.remote).toBeDefined();
      expect(roundtripTransform.remote).toEqual(<string>rulesAlias.transform?.remote);

      const roundtripPresentations = <VerifiablePresentationAttestationModel[]>roundtrip.attestations?.presentations;
      expect(roundtripPresentations).toBeDefined();
      expect(roundtripPresentations.length).toEqual(1);
      expect(<any>roundtripPresentations[0].validityInterval).toEqual(5 * 60);
      expect(Object.keys(<any>roundtripPresentations[0].mapping).length).toEqual(2);

      // when id is not specified, it's the same as the name
      expect((<BaseAttestationModel>roundtripPresentations[0]).id).toEqual((<BaseAttestationModel>roundtripPresentations[0]).name);

      const roundtripIdTokens = <IdTokenAttestationModel[]>roundtrip.attestations?.idTokens;
      expect(roundtripIdTokens).toBeDefined();
      expect(roundtripIdTokens.length).toEqual(1);
      expect(Object.keys(<any>roundtripIdTokens[0].mapping).length).toEqual(2);

      // when id is not specified, it's the same as the name
      expect((<BaseAttestationModel>roundtripIdTokens[0]).id).toEqual((<BaseAttestationModel>roundtripIdTokens[0]).name);

      // decryption keys
      const roundtripDecryptionKeys = <RemoteKeyModel[]>roundtrip.decryptionKeys;
      expect(roundtripDecryptionKeys).toBeDefined();
      expect(roundtripDecryptionKeys.length).toEqual(2);
      expect(roundtripDecryptionKeys[0].authorization).toBeDefined();
      expect(roundtripDecryptionKeys[0].authentication).toBeDefined();

      // ensure the authentication object cascades
      validateAuthenticationModel(AUTH, roundtripDecryptionKeys[0].authentication!);

      const decryptionKey = roundtripDecryptionKeys[0];
      expect(decryptionKey).toBeDefined();
      expect(decryptionKey.authorization).toBeDefined();
      expect(decryptionKey.extractable).toBeTruthy();

      // signing keys
      const roundtripSigningKeys = <RemoteKeyModel[]>roundtrip.signingKeys;
      expect(roundtripSigningKeys).toBeDefined();
      expect(roundtripSigningKeys.length).toEqual(1);
      expect(roundtripSigningKeys[0].authentication).toBeDefined();

      // ensure the authentication object cascades
      validateAuthenticationModel(AUTH, roundtripSigningKeys[0].authentication!);

      // vc model compare
      const roundtripVc = <VerifiableCredentialModel>roundtrip.vc;
      const roundtripContext = <string[]>roundtripVc["@context"];
      const rulesContext = <string[]>RULES.vc?.["@context"];
      const roundtripType = <string[]>roundtripVc.type;
      const rulesType = <string[]>RULES.vc?.type;
      const roundtripSubject = <any>roundtripVc.credentialSubject;
      const rulesSubject = <any>RULES.vc?.credentialSubject;

      expect(roundtripContext).toBeDefined();
      expect(roundtripContext.length).toEqual(rulesContext.length);
      expect(roundtripType.length).toEqual(rulesType.length);
      expect(roundtripSubject.put.here).toBeDefined();
      expect(roundtripSubject.put.here).toBe(rulesSubject.put.here);

      // authentication model
      const roundtripAuth = <AuthenticationModel>roundtrip.authentication;
      expect(roundtripAuth).toBeDefined();
      validateAuthenticationModel(RULES.authentication!, roundtripAuth);


      // event bindings model
      const roundtripEventBindings = <EventBindingModel>roundtrip.eventBindings;
      expect(roundtripEventBindings).toBeDefined();
      expect(roundtripEventBindings.onTokenAugmentation).toBeDefined();

      const tokenAug = <DataProviderModel>roundtripEventBindings.onTokenAugmentation;
      expect(tokenAug.id).toEqual(RULES.eventBindings!.onTokenAugmentation!.id);
      expect(tokenAug.timeoutInMilliseconds).toEqual(RULES.eventBindings!.onTokenAugmentation!.timeoutInMilliseconds);
      expect(tokenAug.authentication).toBeDefined();
      validateAuthenticationModel(AUTH, tokenAug.authentication);
      expect(tokenAug.headers.test).toBeDefined();
      expect(tokenAug.headers.test).toEqual(TestHeader);
    });

    it('Input model must correctly derive from Rules Model ', () => {
      const json = JSON.stringify(RULES);
      const roundtrip = new RulesModel();
      roundtrip.populateFrom(JSON.parse(json));
      const input = new InputModel(roundtrip);

      expect(input.credentialIssuer).toEqual(RULES.credentialIssuer);
      expect(input.issuer).toEqual(RULES.issuer);
      expect(input.id).toEqual("input");

      // the attestation values need to be correct
      const rulesAttestations = <IssuanceAttestationsModel>RULES.attestations;
      const inputAttestations = <IssuanceAttestationsModel>input.attestations;
      expect(inputAttestations).toBeDefined();

      // check the self issued attestation first
      const inputSelfIssuedAttestation = <SelfIssuedAttestationModel>inputAttestations.selfIssued;
      const rulesSelfIssuedAttestation = <SelfIssuedAttestationModel>rulesAttestations.selfIssued;
      expect(inputSelfIssuedAttestation).toBeDefined();
      expect(inputSelfIssuedAttestation.encrypted).toEqual(rulesSelfIssuedAttestation.encrypted);
      expect(inputSelfIssuedAttestation.name).toEqual(SelfIssuedAttestationModel.attestationName);

      // we are going to build a set of input and rules maps for comparison
      const allMaps = [];

      // self issued claims
      let rulesMap = <any>rulesSelfIssuedAttestation.mapping;
      let claims = <InputClaimModel[]>inputSelfIssuedAttestation.claims;
      let inputMap: { [index: string]: any } = {} = {};
      claims.map((value) => inputMap[value.claim!] = value);
      allMaps.push({ rules: rulesMap, input: inputMap });

      // idtokens
      const inputIdTokens = <IdTokenAttestationModel[]>inputAttestations.idTokens;
      const rulesIdTokens = <IdTokenAttestationModel[]>rulesAttestations.idTokens;
      expect(inputIdTokens).toBeDefined();

      for (let i = 0; i < rulesIdTokens.length; i++) {
        expect(inputIdTokens[i].encrypted).toEqual(rulesIdTokens[i].encrypted);
        expect(inputIdTokens[i].scope).toBeDefined();
        expect(inputIdTokens[i].scope).toEqual(rulesIdTokens[i].scope);
        expect(inputIdTokens[i].name).toEqual(rulesIdTokens[i].configuration!);

        rulesMap = rulesIdTokens[i].mapping;
        claims = <InputClaimModel[]>inputIdTokens[i].claims;
        inputMap = {};
        claims.map((value) => inputMap[value.claim!] = value);
        allMaps.push({ rules: rulesMap, input: inputMap });
      }

      // verifiable presentations
      const inputPresentations = <VerifiablePresentationAttestationModel[]>inputAttestations.presentations;
      const rulesPresentations = <VerifiablePresentationAttestationModel[]>rulesAttestations.presentations;
      expect(inputPresentations).toBeDefined();

      for (let i = 0; i < rulesPresentations.length; i++) {
        expect(inputPresentations[i].encrypted).toEqual(rulesPresentations[i].encrypted);
        expect(inputPresentations[i].name).toEqual(rulesPresentations[i].credentialType!);

        rulesMap = rulesPresentations[i].mapping;
        claims = <InputClaimModel[]>inputPresentations[i].claims;
        inputMap = {};
        claims.map((value) => inputMap[value.claim!] = value);
        allMaps.push({ rules: rulesMap, input: inputMap });
      }

      // evaluate all rules/input pairs
      allMaps.forEach((mapsToCompare) => {
        // foreach value in rulesMap, it must exist in inputMap
        Object.keys(mapsToCompare.rules).forEach((key: string) => {
          let value = mapsToCompare.rules[key];
          let lookupKey = <string>value.claim;
          expect(mapsToCompare.input[lookupKey]).toBeDefined();

          // evaluate claim values
          let inputClaim = mapsToCompare.input[lookupKey];
          expect(inputClaim).toBeDefined();
          expect(inputClaim.claim).toEqual(value.claim);
          expect(inputClaim.required).toEqual(value.required);
          expect(inputClaim.type).toEqual(value.type);
        });
      });
    });

    it('missing scope value is still valid', () => {
      const json = JSON.stringify(RULES);
      const roundtrip = new RulesModel();
      roundtrip.populateFrom(JSON.parse(json));

      // setting the scope to undefined ensures back compat with existing contracts
      roundtrip.attestations!.idTokens![0].scope = undefined;

      // derive the input model from the modified rules file
      const input = new InputModel(roundtrip);
      expect(input.attestations!.idTokens![0].scope).toBeUndefined();
    });

    it('should pass populating the VerifiableCredentialModel without context ', () => {
      const vcModel = new VerifiableCredentialModel();
      vcModel.populateFrom({});
      expect(vcModel).toBeDefined();
    });

    it('should pass populating the VerifiablePresentationAttestationModel without context ', () => {
      const vpModel = new VerifiablePresentationAttestationModel();
      vpModel.populateFrom({});
      expect(vpModel).toBeDefined();
    });

    it('should process permissions correctly', () => {
      const permissions = { audit: { allow: ['did:ion:someAllowedDid', 'did:ion:anotherAllowedDid'] }, status: { block: ['did:ion:someBlockedDid'] } };
      const json = JSON.stringify({ ...RULES, permissions });
      const roundtrip = new RulesModel();
      roundtrip.populateFrom(JSON.parse(json));

      // Should populate permissions correctly.
      const outputPermissions = roundtrip.permissions!;
      expect(outputPermissions).toBeDefined();
      expect(JSON.parse(JSON.stringify(outputPermissions))).toEqual(permissions);
    });

    it('should trigger rules validation error with duplicate DIDs in permissions', () => {
      const permissions = { audit: { allow: ['did:ion:someAllowedDid', 'did:ion:someAllowedDid', 'did:ion:anotherAllowedDid'] } };
      const json = JSON.stringify({ ...RULES, permissions });
      const roundtrip = new RulesModel();

      try {
        roundtrip.populateFrom(JSON.parse(json));
        fail('No error was thrown.');
      } catch (error) {
        expect(error instanceof RulesValidationError).toEqual(true);
      }
    });

    it('should trigger rules validation error with empty permissions', () => {
      const permissions = { audit: { allow: ['did:ion:someAllowedDid', 'did:ion:anotherAllowedDid'] }, issue: {} };
      const json = JSON.stringify({ ...RULES, permissions });
      const roundtrip = new RulesModel();

      try {
        roundtrip.populateFrom(JSON.parse(json));
        fail('No error was thrown.');
      } catch (error) {
        expect(error instanceof RulesValidationError).toEqual(true);
      }
    });

    it('should accept models with no attestations', () => {
      const json = JSON.stringify(RULES);
      const roundtrip = new RulesModel();
      roundtrip.populateFrom({ ...JSON.parse(json), attestations: undefined });
      expect(roundtrip.attestations).toBeUndefined();
    });

    it('should trigger error if mapping names are not unique', () => {
      // Make self-issued attestation duplicate.
      RULES.attestations!.selfIssued!.mapping!.name = new InputClaimModel('dulpicateName', 'String');

      const json = JSON.stringify(RULES);
      const roundtrip = new RulesModel();
      expect(() => roundtrip.populateFrom(JSON.parse(json))).toThrowError();

      // Reset self-issued attestations.
      delete RULES.attestations!.selfIssued!.mapping!.name;
    });

    it('RemoteKey Model can specify its own AuthenticationModel instance ', () => {
      const expected = new AuthenticationModel(AuthenticationScheme.basic, 'test');
      RULES.decryptionKeys![0].authentication = expected;

      const json = JSON.stringify(RULES);
      const roundtrip = new RulesModel();
      roundtrip.populateFrom(JSON.parse(json));

      // decryption keys
      const roundtripDecryptionKeys = <RemoteKeyModel[]>roundtrip.decryptionKeys;
      expect(roundtripDecryptionKeys).toBeDefined();
      expect(roundtripDecryptionKeys.length).toEqual(2);
      expect(roundtripDecryptionKeys[0].authentication).toBeDefined();
      validateAuthenticationModel(expected, roundtripDecryptionKeys[0].authentication!);
    });

    it('EventBindingModel.onTokenAugmentation can specify its AuthenticationModel instance ', () => {
      const expected = new AuthenticationModel(AuthenticationScheme.basic, 'test');
      const dpm = new DataProviderModel('test', expected);
      RULES.eventBindings!.onTokenAugmentation = dpm;

      const json = JSON.stringify(RULES);
      const roundtrip = new RulesModel();
      roundtrip.populateFrom(JSON.parse(json));

      // decryption keys
      const roundtripEventBindings = roundtrip.eventBindings!;
      expect(roundtripEventBindings).toBeDefined();
      expect(roundtripEventBindings.onTokenAugmentation).toBeDefined();
      validateAuthenticationModel(expected, roundtripEventBindings.onTokenAugmentation!.authentication!);
    });


    it('BaseAttestationModel.id is set correctly for SelfIssuedAttestationModel', () => {
      const expectedId = 'myId';

      RULES.attestations = new IssuanceAttestationsModel(
        new SelfIssuedAttestationModel(
          {
            alias: new InputClaimModel('name', 'string', false, true, new TransformModel('name', 'remote'))
          },
          false,
          undefined,
          true,
          expectedId
        ),
      );

      const json = JSON.stringify(RULES);
      const roundtrip = new RulesModel();
      roundtrip.populateFrom(JSON.parse(json));

      expect(roundtrip.attestations).toBeDefined();
      expect(roundtrip.attestations?.selfIssued).toBeDefined();
      expect(roundtrip.attestations?.selfIssued?.id).toEqual(expectedId);
    });

    it('BaseAttestationModel.id is set correctly for IdTokenAttestationModel', () => {
      const expectedId = 'myId';

      RULES.attestations = new IssuanceAttestationsModel(
        undefined,
        undefined,
        [
          new IdTokenAttestationModel(
            'oidc config endpoint',
            'clientId',
            'redirect',
            'scope',
            {
              email: new InputClaimModel('upn', 'string', false, true),
              name: new InputClaimModel('name')
            },
            false,
            undefined,
            false,
            expectedId
          ),
        ]
      );

      const json = JSON.stringify(RULES);
      const roundtrip = new RulesModel();
      roundtrip.populateFrom(JSON.parse(json));

      expect(roundtrip.attestations).toBeDefined();
      expect(roundtrip.attestations?.idTokens).toBeDefined();
      expect(roundtrip.attestations?.idTokens![0].id).toEqual(expectedId);
    });

    it('BaseAttestationModel.id is set correctly for VerifiablePresentationAttestationModel', () => {
      const expectedId = 'myId';

      RULES.attestations = new IssuanceAttestationsModel(
        undefined,
        [
          new VerifiablePresentationAttestationModel(
            'CredentialType',
            5 * 60,
            [
              new TrustedIssuerModel('trusted issuer 1'),
              new TrustedIssuerModel('trusted issuer 2')
            ],
            [
              new TrustedIssuerModel('endorser')
            ],
            [
              'contract'
            ],
            {
              givenName: new InputClaimModel('vc.credentialSubject.givenName'),
              familyName: new InputClaimModel('vc.credentialSubject.familyName', 'string', true)
            },
            false,
            undefined,
            false,
            expectedId)
        ]
      );

      const json = JSON.stringify(RULES);
      const roundtrip = new RulesModel();
      roundtrip.populateFrom(JSON.parse(json));

      expect(roundtrip.attestations).toBeDefined();
      expect(roundtrip.attestations?.presentations).toBeDefined();
      expect(roundtrip.attestations?.presentations![0].id).toEqual(expectedId);
    });
  });

  describe('attestations.indexClaims', () => {
    const INDEX_CLAIMS = ['alias', 'email'];

    afterEach(() => {
      RULES.attestations!.selfIssued!.mapping!.alias.indexed = true;
      RULES.attestations!.idTokens![0].mapping!.email.indexed = true;
      RULES.attestations!.presentations![0].mapping!.givenName.indexed = false;

      if (RULES.attestations!.selfIssued!.mapping!.email) {
        delete RULES.attestations!.selfIssued!.mapping!.email;
      }

      if (RULES.attestations!.idTokens![1]) {
        delete RULES.attestations!.idTokens![1];
      }
    });

    it('should return all index claims in self-issued, presentation, and Id Token attestations', () => {
      // Make claim in self-issued attesstations indexed.
      RULES.attestations!.presentations![0].mapping!.givenName.indexed = true;

      // Add additional IdToken with an indexed claim.
      RULES.attestations!.idTokens!.push(new IdTokenAttestationModel(
        'some other oidc config endpoint',
        'some other clientId',
        'some other redirect',
        'some other scope',
        {
          gamerTag: new InputClaimModel('Gamer Tag', 'String', false, true),
        },
      ));

      const { indexClaims } = RULES.attestations!;
      const expectedIndexClaims = [...INDEX_CLAIMS, 'gamerTag', 'givenName'];
      expect(indexClaims.length).toEqual(expectedIndexClaims.length);
      expect(new Set(indexClaims)).toEqual(new Set(expectedIndexClaims));
    });

    it('should return duplicate index claims with no policy enforcement', () => {
      // Add a self-issued claim that clashes with Id Token claim.
      RULES.attestations!.selfIssued!.mapping!.email = new InputClaimModel('duplicateEmail', 'String', true, true);

      const { indexClaims } = RULES.attestations!;
      const expectedIndexClaims = [...INDEX_CLAIMS, 'email'];
      expect(indexClaims.length).toEqual(expectedIndexClaims.length);
      expect(new Set(indexClaims)).toEqual(new Set(expectedIndexClaims));
    });

    it('should return empty array if no claims are indexed', () => {
      // Make all claims unindexed.
      RULES.attestations!.selfIssued!.mapping!.alias.indexed = false;
      RULES.attestations!.idTokens![0].mapping!.email.indexed = false;

      const { indexClaims } = RULES.attestations!;
      expect(indexClaims).toEqual([]);
    });

    it('should ignore attestation models with no mappings', () => {
      // Add additional IdToken with no mapping.
      RULES.attestations!.idTokens!.push(new IdTokenAttestationModel(
        'some other oidc config endpoint',
        'some other clientId',
        'some other redirect',
        'some other scope',
      ));

      const { indexClaims } = RULES.attestations!;
      expect(indexClaims.length).toEqual(INDEX_CLAIMS.length);
      expect(new Set(indexClaims)).toEqual(new Set(INDEX_CLAIMS));
    });

    it('should work even with no self-issued attestations', () => {
      // Temporarily remove self-issued attestations model.
      const selfIssued = RULES.attestations!.selfIssued;
      RULES.attestations!.selfIssued = undefined;

      const { indexClaims } = RULES.attestations!;
      const expectedIndexClaims = ['email'];
      expect(indexClaims).toEqual(expectedIndexClaims);

      // Restore self-issued attestations model.
      RULES.attestations!.selfIssued = selfIssued;
    });

    it('should work even with self-issued attestations with no mapping', () => {
      // Temporarily remove self-issued attestations model mapping.
      const selfIssuedMapping = RULES.attestations!.selfIssued!.mapping;
      RULES.attestations!.selfIssued!.mapping = undefined;

      const { indexClaims } = RULES.attestations!;
      const expectedIndexClaims = ['email'];
      expect(indexClaims).toEqual(expectedIndexClaims);

      // Restore self-issued attestations model mapping.
      RULES.attestations!.selfIssued!.mapping = selfIssuedMapping;
    });

    it('should work even with no presentation attestations', () => {
      // Temporarily remove presentation attestations model.
      const presentations = RULES.attestations!.presentations;
      RULES.attestations!.presentations = undefined;

      const { indexClaims } = RULES.attestations!;
      expect(indexClaims.length).toEqual(INDEX_CLAIMS.length);
      expect(new Set(indexClaims)).toEqual(new Set(INDEX_CLAIMS));

      // Restore presentation attestations model.
      RULES.attestations!.presentations = presentations;
    });

    it('should work even with presentation attestations with no mapping', () => {
      // Temporarily remove presentation attestations model mapping.
      const presentationsMapping = RULES.attestations!.presentations![0].mapping;
      RULES.attestations!.presentations![0].mapping = undefined;

      const { indexClaims } = RULES.attestations!;
      expect(indexClaims.length).toEqual(INDEX_CLAIMS.length);
      expect(new Set(indexClaims)).toEqual(new Set(INDEX_CLAIMS));

      // Restore presentation attestations model mapping.
      RULES.attestations!.presentations![0].mapping = presentationsMapping;
    });

    it('should work even with no Id Token attestations', () => {
      // Temporarily remove presentation attestations model.
      const idTokens = RULES.attestations!.idTokens;
      RULES.attestations!.idTokens = undefined;

      const { indexClaims } = RULES.attestations!;
      const expectedIndexClaims = ['alias'];
      expect(indexClaims).toEqual(expectedIndexClaims);

      // Restore presentation attestations model.
      RULES.attestations!.idTokens = idTokens;
    });
  });
});
