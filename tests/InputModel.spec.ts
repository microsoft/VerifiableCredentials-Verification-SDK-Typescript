/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  BaseAttestationModel,
  IdTokenAttestationModel,
  InputClaimModel,
  InputModel,
  IssuanceAttestationsModel,
  RefreshConfigurationModel,
  RemoteKeyAuthorizationModel,
  RemoteKeyModel,
  RulesModel,
  SelfIssuedAttestationModel,
  TransformModel,
  TrustedIssuerModel,
  VerifiableCredentialModel,
  VerifiablePresentationAttestationModel,
} from '../lib';

describe('InputModel', () => {
  let rulesModel: RulesModel;

  beforeAll(() => {
    rulesModel = new RulesModel(
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
    );
  });

  it('should perserve all attributes of parsed rules input claims', () => {
    const inputModel = new InputModel(rulesModel);
    const attestations = rulesModel.attestations!;
    const outputAttestations = inputModel.attestations!;
    const selfIssued = outputAttestations.selfIssued!;
    const presentations = outputAttestations.presentations!;
    const idTokens = outputAttestations.idTokens!;

    Object.values(attestations.selfIssued!.mapping!).forEach(({ claim, type, required, indexed }) => {
      const outputClaim = selfIssued.claims!.find(({ claim: claimName }) => claimName === claim);
      expect(outputClaim instanceof InputClaimModel).toEqual(true);

      expect(outputClaim!.claim).toEqual(claim);
      expect(outputClaim!.type).toEqual(type);
      expect(outputClaim!.required).toEqual(required);
      expect(outputClaim!.indexed).toEqual(indexed);
    });

    attestations.presentations!.forEach(({ mapping }) => {
      Object.values(mapping!).forEach(({ claim, type, required, indexed }) => {
        const outputPresentation = presentations.find(({ claims }) => claims!.find(({ claim: claimName }) => claimName === claim));
        expect(outputPresentation instanceof BaseAttestationModel).toEqual(true);
        
        const outputClaim = outputPresentation!.claims!.find(({ claim: claimName }) => claimName === claim);
        expect(outputClaim instanceof InputClaimModel).toEqual(true);
  
        expect(outputClaim!.claim).toEqual(claim);
        expect(outputClaim!.type).toEqual(type);
        expect(outputClaim!.required).toEqual(required);
        expect(outputClaim!.indexed).toEqual(indexed);
      });
    });

    attestations.idTokens!.forEach(({ mapping }) => {
      Object.values(mapping!).forEach(({ claim, type, required, indexed }) => {
        const outputIdToken = idTokens.find(({ claims }) => claims!.find(({ claim: claimName }) => claimName === claim));
        expect(outputIdToken instanceof BaseAttestationModel).toEqual(true);
        const outputClaim = outputIdToken!.claims!.find(({ claim: claimName }) => claimName === claim);
        expect(outputClaim instanceof InputClaimModel).toEqual(true);
  
        expect(outputClaim!.claim).toEqual(claim);
        expect(outputClaim!.type).toEqual(type);
        expect(outputClaim!.required).toEqual(required);
        expect(outputClaim!.indexed).toEqual(indexed);
      });
    });
  });
});
