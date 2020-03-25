/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IValidationResponse } from "./IValidationResponse";

export interface IDidValidationResponse extends IValidationResponse {
}

/**
 * Interface for DID validation
 */
export interface IDidValidation {
  /**
   * Validate the token for a correct format
   * @param siop Authentication of requestor
   * @param audience to validate
   * @returns true if validation passes
   */
  validate(token: any, audience: string): Promise<IDidValidationResponse>;
}
