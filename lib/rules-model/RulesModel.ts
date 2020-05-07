/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BaseIssuanceModel } from './BaseIssuanceModel';
import { IssuanceAttestationsModel } from './IssuanceAttestationsModel';
import { RemoteKeyModel } from './RemoteKeyModel';
import { RefreshConfigurationModel } from './RefreshConfigurationModel';
import { VerifiableCredentialModel } from './VerifiableCredentialModel';
import { TrustedIssuerModel } from '..';

/**
 * Data Model to serialize a Rules file into
 */
export class RulesModel extends BaseIssuanceModel {
  /**
   *
   * @param credentialIssuer url to the issuance endpoint of the Verifiable Credential
   * @param issuer the DID of the Verifiable Credential Issuer
   * @param attestations IssuanceAttestationsModel instance
   * @param validityInterval the time in seconds after issuance that the Verifiable Credential will be valid for
   * @param decryptionKeys An array of RemoteKey objects which allow an encrypted attestation to be decrypted.
   * @param signingKeys An array of RemoteKey objects which will sign the Verifiable Credential
   * @param refresh describes if Verifiable Credential refresh is enabled and for how long
   * @param statusCheckDisabled flag indicating that the credentialStatus claim must be omitted from a Verifiable Credential
   * @param clientRevocationDisabled flag indicating that the revokeService claim must be omitted from a Verifiable Credential. Use of this flag allows an
   * Issuer to customize revocation operations
   * @param vc VerifiableCredential instance
   * @param minimalDisclosure a flag indicating if the issuer should create a minimal disclosure credential
   * @param endorsers optional array of endorsers of the Verifiable Credential Issuer
   */
  constructor(
    credentialIssuer?: string,
    issuer?: string,
    attestations?: IssuanceAttestationsModel,
    public validityInterval?: number,
    public decryptionKeys?: RemoteKeyModel[],
    public signingKeys?: RemoteKeyModel[],
    public refresh?: RefreshConfigurationModel,
    public statusCheckDisabled: boolean = false,
    public clientRevocationDisabled: boolean = false,
    public vc?: VerifiableCredentialModel,
    public minimalDisclosure: boolean = false,
    public endorsers?: TrustedIssuerModel[]) {
    super(credentialIssuer, issuer, attestations);
  }

  /**
   * Populate an instance of RemoteKeyAuthorizationModel from any instance
   * @param input object instance to populate from
   */
  populateFrom(input: any): void {
    super.populateFrom(input);
    this.validityInterval = input.validityInterval;
    this.statusCheckDisabled = input.statusCheckDisabled ?? false;
    this.minimalDisclosure = input.minimalDisclosure ?? false;
    this.endorsers = input.endorsers;
    this.clientRevocationDisabled = input.clientRevocationDisabled ?? false;

    if (input.decryptionKeys) {
      const arr = Array.from(input.decryptionKeys);
      this.decryptionKeys = arr.map(RulesModel.createRemoteKey);
    }

    if (input.signingKeys) {
      const arr = Array.from(input.signingKeys);
      this.signingKeys = arr.map(RulesModel.createRemoteKey);
    }

    if (input.refresh) {
      this.refresh = new RefreshConfigurationModel();
      this.refresh.populateFrom(input.refresh);
    }

    if(input.vc){
      this.vc = new VerifiableCredentialModel();
      this.vc.populateFrom(input.vc);
    }
  }

  private static createRemoteKey(key: any): RemoteKeyModel {
    const k = new RemoteKeyModel();
    k.populateFrom(key);
    return k;
  }
}
