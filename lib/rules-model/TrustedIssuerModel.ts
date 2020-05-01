/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Model for defining a Trusted Issuer for a Verifiable Credential
 */
export class TrustedIssuerModel {
  /**
   * Creates a Trusted Issuer instance
   * @param iss the Decentralized Identity of the Issuer
   */
  constructor (public iss?: string) {
  }

  /**
   * Populate an instance of TrustedIssuerModel from any instance
   * @param input object instance to populate from
   */
  populateFrom (input: any): void {
    this.iss = input.iss;
  }
}
