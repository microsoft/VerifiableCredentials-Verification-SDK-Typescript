/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IValidationResponse } from './IValidationResponse';
import ClaimToken from '../VerifiableCredential/ClaimToken';

export interface VerifiablePresentationValidationResponse extends IValidationResponse {
}

/**
 * Interface for verifiable presentation validation
 */
export interface IVerifiablePresentationValidation {

  /**
   * Validate the verifiable presentation
   * @param verifiablePresentation The presentation to validate as a signed token
   * @param siopDid The did which presented the siop
   * @param audience The expected audience for the token
   * @returns true if validation passes
   */
  validate(verifiablePresentationToken: ClaimToken, siopDid: string, audience: string): Promise<IValidationResponse>;
}
