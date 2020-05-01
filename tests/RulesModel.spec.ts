/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TSMap } from 'typescript-map';
import { IdTokenAttestationModel, InputClaimModel, InputModel, IssuanceAttestationsModel, RefreshConfigurationModel, RemoteKeyAuthorizationModel, RemoteKeyModel, RulesModel, SelfIssuedAttestationModel, TransformModel, TrustedIssuerModel, VerifiableCredentialModel, VerifiablePresentationAttestationModel } from '../lib';

describe('TenantSourceFactory', () => {

  const RULES = new RulesModel(
    'issuer uri',
    'issuer',
    new IssuanceAttestationsModel(
      new SelfIssuedAttestationModel(
        new TSMap<string, InputClaimModel>([
          ['alias', new InputClaimModel('name', 'string', false, true, new TransformModel('name', 'remote'))]
        ]),
        false,
        undefined,
        true
      ),
      [
        new VerifiablePresentationAttestationModel(
          'CredentialType',
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
          new TSMap<string, InputClaimModel>(
            [
              ['givenName', new InputClaimModel('vc.credentialSubject.givenName')],
              ['familyName', new InputClaimModel('vc.credentialSubject.familyName', 'string', true)]
            ])
        ),
      ],
      [
        new IdTokenAttestationModel(
          'oidc config endpoint',
          'clientId',
          'redirect',
          new TSMap<string, InputClaimModel>(
            [
              ['email', new InputClaimModel('upn', 'string', false, true)],
              ['name', new InputClaimModel('name')]
            ])
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
    ]
  );

  // tslint:disable-next-line:max-func-body-length
  describe('RulesModel class serialization', () => {

    it('Rules model must roundtrip ', async () => {
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
      const roundtripSelfIssuedMapping = <TSMap<string, InputClaimModel>>roundtripSelfIssued.mapping;
      expect(roundtripSelfIssued).toBeDefined();
      expect(roundtripSelfIssuedMapping).toBeDefined();
      expect(roundtripSelfIssued.required).toEqual(rulesSelfIssuedAttestation.required);
      expect(roundtripSelfIssuedMapping.length).toEqual(<number>RULES.attestations?.selfIssued?.mapping?.length);

      // analyze the contents of input claim
      const roundtripAlias = <InputClaimModel>roundtrip.attestations?.selfIssued?.mapping?.get('alias');
      const rulesAlias = <InputClaimModel>RULES.attestations?.selfIssued?.mapping?.get('alias');
      expect(roundtripAlias).toBeDefined();
      expect(roundtripAlias.indexed).toBeTruthy();

      const roundtripTransform = <TransformModel>roundtripAlias.transform;
      expect(roundtripTransform).toBeDefined();
      expect(roundtripTransform.remote).toBeDefined();
      expect(roundtripTransform.remote).toEqual(<string>rulesAlias.transform?.remote);

      const roundtripPresentations = <VerifiablePresentationAttestationModel[]>roundtrip.attestations?.presentations;
      expect(roundtripPresentations).toBeDefined();
      expect(roundtripPresentations.length).toEqual(1);
      expect(roundtripPresentations[0].mapping?.length).toEqual(2);

      const roundtripIdTokens = <IdTokenAttestationModel[]>roundtrip.attestations?.idTokens;
      expect(roundtripIdTokens).toBeDefined();
      expect(roundtripIdTokens.length).toEqual(1);
      expect(roundtripIdTokens[0].mapping?.length).toEqual(2);

      // decryption keys
      const roundtripDecryptionKeys = <RemoteKeyModel[]>roundtrip.decryptionKeys;
      expect(roundtripDecryptionKeys).toBeDefined();
      expect(roundtripDecryptionKeys.length).toEqual(2);
      expect(roundtripDecryptionKeys[0].authorization).toBeDefined();

      var decryptionKey = roundtripDecryptionKeys[0];
      expect(decryptionKey).toBeDefined();
      expect(decryptionKey.authorization).toBeDefined();
      expect(decryptionKey.extractable).toBeTruthy();

      // signing keys
      const roundtripSigningKeys = <RemoteKeyModel[]>roundtrip.signingKeys;
      expect(roundtripSigningKeys).toBeDefined();
      expect(roundtripSigningKeys.length).toEqual(1);

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
    });

    it('Input model must correctly derive from Rules Model ', async () => {
      const input = new InputModel(RULES);

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

      // we are going to build a set of input and rules maps for comparison
      const allMaps = [];

      // self issued claims
      let rulesMap = <TSMap<string, InputClaimModel>>rulesSelfIssuedAttestation.mapping;
      let claims = <InputClaimModel[]>inputSelfIssuedAttestation.claims;
      let inputMap = new TSMap<string, InputClaimModel>();
      claims.map((value) => inputMap.set(<string>value.claim, value));
      allMaps.push({ rules: rulesMap, input: inputMap });

      // idtokens
      const inputIdTokens = <IdTokenAttestationModel[]>inputAttestations.idTokens;
      const rulesIdTokens = <IdTokenAttestationModel[]>rulesAttestations.idTokens;
      expect(inputIdTokens).toBeDefined();

      for (let i = 0; i < rulesIdTokens.length; i++) {
        expect(inputIdTokens[i].encrypted).toEqual(rulesIdTokens[i].encrypted);

        rulesMap = <TSMap<string, InputClaimModel>>rulesIdTokens[i].mapping;
        claims = <InputClaimModel[]>inputIdTokens[i].claims;
        inputMap = new TSMap<string, InputClaimModel>();
        claims.map((value) => inputMap.set(<string>value.claim, value));
        allMaps.push({ rules: rulesMap, input: inputMap });
      }

      // verifiable presentations
      const inputPresentations = <VerifiablePresentationAttestationModel[]>inputAttestations.presentations;
      const rulesPresentations = <VerifiablePresentationAttestationModel[]>rulesAttestations.presentations;
      expect(inputPresentations).toBeDefined();

      for (let i = 0; i < rulesPresentations.length; i++) {
        expect(inputPresentations[i].encrypted).toEqual(rulesPresentations[i].encrypted);

        rulesMap = <TSMap<string, InputClaimModel>>rulesPresentations[i].mapping;
        claims = <InputClaimModel[]>inputPresentations[i].claims;
        inputMap = new TSMap<string, InputClaimModel>();
        claims.map((value) => inputMap.set(<string>value.claim, value));
        allMaps.push({ rules: rulesMap, input: inputMap });
      }

      // evaluate all rules/input pairs
      allMaps.forEach((mapsToCompare) => {
        // foreach value in rulesMap, it must exist in inputMap
        mapsToCompare.rules.forEach((value: InputClaimModel, _key?: string, _index?: number) => {
          let lookupKey = <string>value.claim;
          expect(mapsToCompare.input.has(lookupKey)).toBeTruthy();

          // evaluate claim values
          let inputClaim = mapsToCompare.input.get(lookupKey);
          expect(inputClaim).toBeDefined();
          expect(inputClaim.claim).toEqual(value.claim);
          expect(inputClaim.required).toEqual(value.required);
          expect(inputClaim.type).toEqual(value.type);
        });
      });
    });

    it('should pass populating the VerifiableCredentialModel without context ', async () => {
      const vcModel = new VerifiableCredentialModel();
      vcModel.populateFrom({});
      expect(vcModel).toBeDefined();
    });

    it('should pass populating the VerifiablePresentationAttestationModel without context ', async () => {
      const vpModel = new VerifiablePresentationAttestationModel();
      vpModel.populateFrom({});
      expect(vpModel).toBeDefined();
    });

  });
});
