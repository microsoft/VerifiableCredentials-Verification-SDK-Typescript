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
   * @param siopDid needs to be equal to audience of VC
   * @param siopContract Conract type asked during siop
   * @returns true if validation passes
   */
  validate(verifiableCredential: string | object, siopDid: string, siopContract: string): Promise<IValidationResponse>;
}
