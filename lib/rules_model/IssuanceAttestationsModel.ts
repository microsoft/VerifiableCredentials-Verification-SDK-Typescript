/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RulesValidationError } from '../error_handling/RulesValidationError';
import { IdTokenAttestationModel } from './IdTokenAttestationModel';
import { SelfIssuedAttestationModel } from './SelfIssuedAttestationModel';
import { VerifiablePresentationAttestationModel } from './VerifiablePresentationAttestationModel';

/**
 * Model for attestations for input contract
 */
export class IssuanceAttestationsModel {
  private _hasAttestations: boolean = false;

  /**
   *
   * @param selfIssued SelfIssuedAttestationModel instance
   * @param presentations an array of VerifiablePresentationModel instances
   * @param idTokens an array of IdTokenAttestationModel instances
   */
  constructor(
    public selfIssued?: SelfIssuedAttestationModel,
    public presentations?: VerifiablePresentationAttestationModel[],
    public idTokens?: IdTokenAttestationModel[]) {
  }

  /**
   * Mapping keys for all selfIssued, presentation, and Id Token index claims. 
   */
  public get indexClaims(): string[] {
    const allIndexClaims: string[] = [];

    if (this.selfIssued) {
      allIndexClaims.push(...this.selfIssued.indexClaims);
    }

    if (this.presentations) {
      this.presentations.forEach(({ indexClaims }) => allIndexClaims.push(...indexClaims));
    }

    if (this.idTokens) {
      this.idTokens.forEach(({ indexClaims }) => allIndexClaims.push(...indexClaims));
    }

    return allIndexClaims;
  }

  /**
   * indicates whether or not there are attestations defined
   */
  public get hasAttestations(): boolean {
    return this._hasAttestations;
  }

  /**
   * Derives an IssuanceAttestationModel for input from a Rules attestation model
   */
  forInput(): IssuanceAttestationsModel {
    return new IssuanceAttestationsModel(
      this.selfIssued === undefined ? undefined : <SelfIssuedAttestationModel>this.selfIssued.forInput(),
      this.presentations === undefined ? undefined : this.presentations.map(presentation => <VerifiablePresentationAttestationModel>presentation.forInput()),
      this.idTokens === undefined ? undefined : this.idTokens.map(token => <IdTokenAttestationModel>token.forInput()));
  }

  /**
   * Populate an instance of IssuanceAttestationsModel from any instance
   * @param input object instance to populate from
   */
  populateFrom(input: any): void {
    const outputClaims = new Set<string>();
    let totalOutputClaims = 0;

    if (input.selfIssued !== undefined) {
      this._hasAttestations = true;
      this.selfIssued = new SelfIssuedAttestationModel();
      this.selfIssued.populateFrom(input.selfIssued);

      if (this.selfIssued.mapping) {
        const outputAttestationKeys = Object.keys(this.selfIssued.mapping);
        totalOutputClaims += outputAttestationKeys.length;
        outputAttestationKeys.forEach(outputAttestation => outputClaims.add(outputAttestation));
      }
    }

    if (input.presentations !== undefined) {
      const arr = Array.from(input.presentations);
      this.presentations = arr.map(presentation => {
        const p = new VerifiablePresentationAttestationModel();
        p.populateFrom(presentation);

        if (p.mapping) {
          const outputAttestationKeys = Object.keys(p.mapping);
          totalOutputClaims += outputAttestationKeys.length;
          outputAttestationKeys.forEach(outputAttestation => outputClaims.add(outputAttestation));
        }

        return p;
      });

      this._hasAttestations = this._hasAttestations || this.presentations.length > 0;
    }

    if (input.idTokens !== undefined) {
      const arr = Array.from(input.idTokens);
      this.idTokens = arr.map(token => {
        const t = new IdTokenAttestationModel();
        t.populateFrom(token);

        if (t.mapping) {
          const outputAttestationKeys = Object.keys(t.mapping);
          totalOutputClaims += outputAttestationKeys.length;
          outputAttestationKeys.forEach(outputAttestation => outputClaims.add(outputAttestation));
        }

        return t;
      });

      this._hasAttestations = this._hasAttestations || this.idTokens.length > 0;
    }

    // Ensure uniqueness of attestation mapping keys. Non-uniqueness leads to data loss.
    if (totalOutputClaims !== outputClaims.size) {
      throw new RulesValidationError('Attestation mapping names must be unique.');
    }
  }
}