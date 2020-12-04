/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InputClaimModel } from './InputClaimModel';
import { BaseAttestationModel } from './BaseAttestationModel';

/**
 * Model for defining Self Issued claims
 */
export class SelfIssuedAttestationModel extends BaseAttestationModel {

  public static readonly attestationName: string = 'selfAttested';

  /**
   *
   * @param mapping a map of string to InputClaimModel instances
   * @param encrypted flag indicating if the attestation is encrypted
   * @param claims an array of InputClaimModel values
   * @param required a flag indicating whether the attestation is required
   * @param id the identifier of the attestation
   */
  constructor(mapping?: { [map: string]: InputClaimModel }, encrypted: boolean = false, claims?: InputClaimModel[], required: boolean = false, id?: string) {
    super(mapping, encrypted, claims, required, id);
  }

  /**
   * Gets the name of the attestation
   */
  get name(): string {
    return SelfIssuedAttestationModel.attestationName;
  }

  /**
   * Creates Model given input claims.
   * @param claims Input claims
   */
  protected createForInput(claims: InputClaimModel[]): BaseAttestationModel {
    return new SelfIssuedAttestationModel(undefined, this.encrypted, claims, this.required);
  }
}
