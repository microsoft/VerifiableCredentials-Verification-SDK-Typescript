/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IValidationResponse } from './IValidationResponse';

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
   * @returns true if validation passes
   */
  validate(verifiablePresentationToken: string, siopDid?: string): Promise<IValidationResponse>;
}
