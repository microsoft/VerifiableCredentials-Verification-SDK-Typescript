/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IValidationResponse } from './IValidationResponse';

export interface VerifiableCredentialValidationResponse extends IValidationResponse {
}

/**
 * Interface for verifiable credential validation
 */
export interface IVerifiableCredentialValidation {

  /**
   * Validate the verifiable credential
   * @param verifiableCredential The credential to validate as a signed token
   * @param siopDid The did which presented the siop
   * @returns true if validation passes
   */
  validate(verifiableCredential: string, siopDid: string): Promise<IValidationResponse>;
}
