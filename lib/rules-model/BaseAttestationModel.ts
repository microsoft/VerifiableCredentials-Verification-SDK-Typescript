/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InputClaimModel } from './InputClaimModel';

/**
 * Base class for input attestations
 */
export abstract class BaseAttestationModel {

  /**
   *
   * @param mapping a map of string to InputClaimModel instances
   * @param encrypted flag indicating if the attestation is encrypted
   * @param claims an array of InputClaimModel values
   * @param required an array of InputClaimModel values
   */
  constructor(
    public mapping?: { [map: string]: InputClaimModel },
    public encrypted = false,
    public claims?: InputClaimModel[],
    public required = false
  ) {
  }

  /**
   * Populate an instance of BaseAttestationModel from any instance
   * @param input object instance to populate from
   */
  populateFrom(input: any): void {
    this.encrypted = input.encrypted;
    this.claims = input.claims;
    this.mapping = {};
    this.required = input.required;

    if (input.mapping) {
      for (let key of Object.keys(input.mapping)) {
        let claim = new InputClaimModel();
        claim.populateFrom(input.mapping[key]);
        this.mapping[key] = claim;
      }
    }
  }

  /**
   * Create a IdTokenAttestationModel for an input resource
   */
  forInput(): BaseAttestationModel {
    const arr: InputClaimModel[] = [];
    for (let key in this.mapping) {
      arr.push(this.mapping![key].forInput());
    }

    return this.createForInput(arr);
  }

  /**
   * Creates Model given input claims.
   * @param claims Input claims
   */
  protected abstract createForInput(claims: InputClaimModel[]): BaseAttestationModel;
}
