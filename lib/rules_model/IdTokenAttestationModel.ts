/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BaseAttestationModel } from './BaseAttestationModel';
import { InputClaimModel } from './InputClaimModel';
import { TrustedIssuerModel } from './TrustedIssuerModel';

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
   * @param id the identifier of the attestation
   * @param issuers an array of Trusted Issuers for the IdToken
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
    required: boolean = false,
    id?: string,
    public issuers?: TrustedIssuerModel[],
  ) {
    super(mapping, encrypted, claims, required, id);
  }

  /**
   * Gets the name of the attestation
   */
  get name(): string {
    return this.configuration!;
  }

  toJSON(): any {
    const result = super.toJSON();
    result.configuration = this.configuration;
    result.client_id = this.client_id;
    result.issuers = this.issuers;
    result.redirect_uri = this.redirect_uri;
    result.scope = this.scope;
    return result;
  }

  /**
   * Populate an instance of IdTokenAttestationModel from any instance
   * @param input object instance to populate from
   */
  populateFrom(input: any): void {
    super.populateFrom(input);
    this.configuration = input.configuration;
    this.client_id = input.client_id;
    this.redirect_uri = input.redirect_uri;
    this.scope = input.scope;

    if (input.issuers) {
      this.issuers = Array.from(input.issuers, (issuer) => {
        const t = new TrustedIssuerModel();
        t.populateFrom(issuer);
        return t;
      });
    }
  }

  /**
   * Creates Model given input claims.
   * @param claims Input claims
   */
  protected createForInput(claims: InputClaimModel[]): BaseAttestationModel {
    return new IdTokenAttestationModel(
      this.configuration,
      this.client_id,
      this.redirect_uri,
      this.scope,
      undefined,
      this.encrypted,
      claims,
      this.required,
      undefined,
      this.issuers,
    );
  }
}
