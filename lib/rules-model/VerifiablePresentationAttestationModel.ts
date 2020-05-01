/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TrustedIssuerModel } from './TrustedIssuerModel';
import { BaseAttestationModel } from './BaseAttestationModel';
import { TSMap } from 'typescript-map';
import { InputClaimModel } from './InputClaimModel';

/**
 * Represents a Verifiable Presentation in the input file
 */
export class VerifiablePresentationAttestationModel extends BaseAttestationModel {
  /**
   * Instantiates a VerifiablePresentationModel
   * @param credentialType the type of the Verifiable Credential as specified: https://www.w3.org/TR/vc-data-model/#types
   * @param issuers an array of Trusted Issuers for the Verifiable Credential
   * @param endorsers an array of Trusted Endorsers for the Verifiable Credential
   * @param contracts an array of URLs to approved contracts which return the type of Verifiable Credential
   * @param mapping a map of string to InputClaimModel instances
   * @param encrypted flag indicating if the attestation is encrypted
   * @param claims an array of InputClaimModel values
   * @param required a flag indicating whether the attestation is required
   */
  constructor (
    public credentialType?: string, 
    public issuers?: TrustedIssuerModel[], 
    public endorsers?: TrustedIssuerModel[], 
    public contracts?: string[],
    mapping?: TSMap<string, InputClaimModel>, 
    encrypted: boolean = false, 
    claims?: InputClaimModel[], 
    required: boolean = false) {
    super(mapping, encrypted, claims, required);
  }

  /**
   * Populate an instance of VerifiablePresentationModel from any instance
   * @param input object instance to populate from
   */
  populateFrom (input: any): void {
    super.populateFrom(input);
    this.credentialType = input.credentialType;
    this.contracts = input.contracts;

    if (input.issuers) {
      const arr = Array.from(input.issuers);
      this.issuers = arr.map(VerifiablePresentationAttestationModel.createTrustedIssuer);
    }

    if (input.endorsers) {
      const arr = Array.from(input.endorsers);
      this.endorsers = arr.map(VerifiablePresentationAttestationModel.createTrustedIssuer);
    }
  }

  private static createTrustedIssuer (issuer: any): TrustedIssuerModel {
    const t = new TrustedIssuerModel();
    t.populateFrom(issuer);
    return t;
  }

  /**
   * Creates Model given input claims.
   * @param claims Input claims
   */
  protected createForInput(claims: InputClaimModel[]): BaseAttestationModel {
    return new VerifiablePresentationAttestationModel(
      this.credentialType,
      this.issuers,
      this.endorsers,
      this.contracts,
      undefined,
      this.encrypted,
      claims,
      this.required
    );
  }
}
