/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IssuanceAttestationsModel } from './IssuanceAttestationsModel';

/**
 * Base class for the modeling the Rules/Input files
 */
export abstract class BaseIssuanceModel {
  /**
   *
   * @param credentialIssuer url to the issuance endpoint of the Verifiable Credential
   * @param issuer the DID of the Verifiable Credential Issuer
   * @param attestations IssuanceAttestationsModel instance
   */
  constructor (public credentialIssuer?: string,  public issuer?: string, public attestations?: IssuanceAttestationsModel) {}

  /**
   * Populate an instance of BaseAttestationModel from any instance
   * @param input object instance to populate from
   */
  populateFrom (input: any): void {
    if (input.attestations) {
      this.attestations = new IssuanceAttestationsModel();
      this.attestations.populateFrom(input.attestations);
    }

    this.credentialIssuer = input.credentialIssuer;
    this.issuer = input.issuer;
  }
}
