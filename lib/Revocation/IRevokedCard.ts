/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Interface to model revoced cards
 */
export default interface IRevocedCard {
  /**
   * The identifier of a Verifiable Credential, presented as the jti claim in a JWT
   */
  verifiableCredentialId: string;

  /**
   * The epoch timestamp of when the action occurred
   */
  actionTimeInSeconds: number;

  /**
   * Tenant Id of the Issuer of the Verifiable Credential
   */
  tenantId: string;

  /**
   * The DID of the issuer performing the revocation
   */
  issuerDid: string;
}
