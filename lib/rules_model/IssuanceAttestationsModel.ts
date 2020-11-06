/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SelfIssuedAttestationModel } from './SelfIssuedAttestationModel';
import { VerifiablePresentationAttestationModel } from './VerifiablePresentationAttestationModel';
import { IdTokenAttestationModel } from './IdTokenAttestationModel';

/**
 * Model for attestations for input contract
 */
export class IssuanceAttestationsModel {
  /**
   *
   * @param selfIssued SelfIssuedAttestationModel instance
   * @param presentations an array of VerifiablePresentationModel instances
   * @param idTokens an array of IdTokenAttestationModel instances
   */
  constructor (
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
      const { indexClaims } = this.selfIssued;

      if (indexClaims) {
        allIndexClaims.push(...indexClaims);
      }
    }

    if (this.presentations) {
      this.presentations.forEach(({ indexClaims }) => {
        if (indexClaims) {
          allIndexClaims.push(...indexClaims);
        }
      });
    }

    if (this.idTokens) {
      this.idTokens.forEach(({ indexClaims }) => {
        if (indexClaims) {
          allIndexClaims.push(...indexClaims);
        }
      });
    }

    return allIndexClaims;
  }

  /**
   * Derives an IssuanceAttestationModel for input from a Rules attestation model
   */
  forInput (): IssuanceAttestationsModel {
    return new IssuanceAttestationsModel(
      this.selfIssued === undefined ? undefined : <SelfIssuedAttestationModel>this.selfIssued.forInput(),
      this.presentations === undefined ? undefined : this.presentations.map(presentation => <VerifiablePresentationAttestationModel>presentation.forInput()),
      this.idTokens === undefined ? undefined : this.idTokens.map(token => <IdTokenAttestationModel>token.forInput()));
  }

  /**
   * Populate an instance of IssuanceAttestationsModel from any instance
   * @param input object instance to populate from
   */
  populateFrom (input: any): void {
    if (input.selfIssued !== undefined) {
      this.selfIssued = new SelfIssuedAttestationModel();
      this.selfIssued.populateFrom(input.selfIssued);
    }

    if (input.presentations !== undefined) {
      const arr = Array.from(input.presentations);
      this.presentations = arr.map(presentation => {
        const p = new VerifiablePresentationAttestationModel();
        p.populateFrom(presentation);
        return p;
      });
    }

    if (input.idTokens !== undefined) {
      const arr = Array.from(input.idTokens);
      this.idTokens = arr.map(token => {
        const t = new IdTokenAttestationModel();
        t.populateFrom(token);
        return t;
      });
    }
  }
}
