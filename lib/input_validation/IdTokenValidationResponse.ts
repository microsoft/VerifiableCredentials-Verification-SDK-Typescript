/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import ClaimToken from '../verifiable_credential/ClaimToken';
import { IValidationResponse } from './IValidationResponse';

export interface IdTokenValidationResponse extends IValidationResponse {

  /**
   * The expected issuer of the token extracted from token configuration
   */
  expectedIssuer?: string;
}


/**
 * Interface for id token validation
 */
export interface IIdTokenValidation {

  /**
   * Validate the id token
   * @param idToken The presentation to validate as a signed token
   * @param audience The expected audience for the token
   * @returns true if validation passes
   */
  validate(idToken: ClaimToken): Promise<IValidationResponse>;
}
