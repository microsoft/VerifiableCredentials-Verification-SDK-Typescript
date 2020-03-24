/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import ClaimBag from "../VerifiableCredential/ClaimBag";
import { IValidationResponse } from "./IValidationResponse";

export interface ISiopValidationResponse extends IValidationResponse {

  /**
   * The schema
   */
  schema?: string;

  /**
   * Claim in the request and rule file
   */
  claimBag?: ClaimBag;
}

/**
 * Interface for input validation
 */
export interface ISiopValidation {
  /**
   * Validate the input for a correct format
   * @param siop Authentication of requestor
   * @param audience to validate
   * @returns true if validation passes
   */
  validate(siop: any, audience: string): Promise<ISiopValidationResponse>;
}
