/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AuthenticationModel } from './AuthenticationModel';
import { BaseIssuanceModel } from './BaseIssuanceModel';
import { EventBindingModel } from './EventBindingModel';
import { IssuanceAttestationsModel } from './IssuanceAttestationsModel';
import { RefreshConfigurationModel } from './RefreshConfigurationModel';
import { RemoteKeyModel } from './RemoteKeyModel';
import { RulesPermissionModel } from './RulesPermissionModel';
import { TrustedIssuerModel } from './TrustedIssuerModel';
import { VerifiableCredentialModel } from './VerifiableCredentialModel';

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
   * @param authentication optional AuthenticationModel instance
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
    public endorsers?: TrustedIssuerModel[],
    public permissions?: { [endpoint: string]: RulesPermissionModel },
    public authentication?: AuthenticationModel,
    public eventBindings?: EventBindingModel
  ) {
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

    const { decryptionKeys, permissions, refresh, signingKeys, vc, authentication, eventBindings } = input;

    // the AuthenticationModel is populated first because it may cascade down into child objects
    if (authentication) {
      this.authentication = AuthenticationModel.fromJSON(authentication);
    }

    if (decryptionKeys) {
      this.decryptionKeys = Array.from(decryptionKeys, key => RulesModel.createRemoteKey(key, this.authentication));
    }

    if (signingKeys) {
      this.signingKeys = Array.from(signingKeys, key => RulesModel.createRemoteKey(key, this.authentication));
    }

    if (refresh) {
      this.refresh = new RefreshConfigurationModel();
      this.refresh.populateFrom(refresh);
    }

    if (vc) {
      this.vc = new VerifiableCredentialModel();
      this.vc.populateFrom(vc);
    }

    if (permissions) {
      this.permissions = Object.entries(<{ [endpoint: string]: any }>permissions).reduce((all, [endpoint, input]) => (
        Object.assign(all, { [endpoint]: RulesPermissionModel.create(input) })
      ), <{ [endpoint: string]: RulesPermissionModel }>{});
    }

    if(eventBindings){
      this.eventBindings = new EventBindingModel();
      this.eventBindings.populateFrom(eventBindings, this.authentication);
    }
  }

  private static createRemoteKey(key: any, authentication?: AuthenticationModel): RemoteKeyModel {
    const k = new RemoteKeyModel();
    k.populateFrom(key, authentication);
    return k;
  }
}
