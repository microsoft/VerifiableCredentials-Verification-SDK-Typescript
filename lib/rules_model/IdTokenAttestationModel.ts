/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BaseAttestationModel } from './BaseAttestationModel';
import { InputClaimModel } from './InputClaimModel';

/**
 * Model for defining Open Id Configuration for an Input contract
 */
export class IdTokenAttestationModel extends BaseAttestationModel {
  /**
   *
   * @param configuration url to an Open Id Connect Provider configuration
   * @param client_id if dynamic registration is not supported, the registered client to use for implicit authorization flows
   * @param redirect_uri if dynamic registration is not supported, the redirect_uri used for implicit authorization flows
   * @param scope scope value to augment the required openid value
   * @param mapping a map of string to InputClaimModel instances
   * @param encrypted flag indicating if the attestation is encrypted
   * @param claims an array of InputClaimModel values
   * @param required a flag indicating whether the attestation is required
   */
  constructor(
    public configuration?: string,
    // tslint:disable-next-line:variable-name
    public client_id?: string,
    // tslint:disable-next-line:variable-name
    public redirect_uri?: string,
    public scope?: string,
    mapping?: { [map: string]: InputClaimModel }, 
    encrypted: boolean = false, 
    claims?: InputClaimModel[], 
    required: boolean = false) {
    super(mapping, encrypted, claims, required);
  }

  /**
   * Gets the name of the attestation
   */
  get name(): string {
    return this.configuration!;
  }

  /**
   * Populate an instance of IdTokenAttestationModel from any instance
   * @param input object instance to populate from
   */
  populateFrom(input: any): void {
    super.populateFrom(input);
    this.configuration = input.configuration;
    this.client_id = input.client_id;
    this.redirect_uri  = input.redirect_uri;
    this.scope = input.scope;
  }

  /**
   * Creates Model given input claims.
   * @param claims Input claims
   */
  protected createForInput(claims: InputClaimModel[]): BaseAttestationModel {
    return new IdTokenAttestationModel(this.configuration, this.client_id, this.redirect_uri, this.scope, undefined, this.encrypted, claims, this.required);
  }
}
