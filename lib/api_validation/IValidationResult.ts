/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

 import { ClaimToken, IVerifiablePresentationStatus } from '../index';

export default interface IValidationResult {
/**
 * Gets the DID of the requestor
 */
  did?: string,

  /**
   * Gets the contract of the requestor
   */
  contract?: string,

  /**
   * Claims found in the input verifiable credentials
   */
  verifiableCredentials?: { [type: string]: ClaimToken },

  /**
   * Claims found in the input verifiable presentations
   */
  verifiablePresentations?:  { [type: string]: ClaimToken },

  /**
   * Claims found in the input id tokens
   */
  idTokens?: { [id: string]: ClaimToken },

  /**
   * Claims found in the input self issued token
   */
  selfIssued?: ClaimToken

  /**
   * Claims found in the input SIOP
   */
  siop?: ClaimToken

  /**
   * The jti of the incoming siop token
   */
  siopJti?: string,

  verifiablePresentationStatus?: { [jti: string]: IVerifiablePresentationStatus }
}