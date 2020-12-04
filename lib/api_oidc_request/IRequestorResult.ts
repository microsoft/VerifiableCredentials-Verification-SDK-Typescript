/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IValidationResult, ClaimToken } from '../index';

/**
 * The requestor result interface
 */
export interface IRequestorResult {
  /**
   * True if passed
   */
  result: boolean;

  /**
   * Suggested Http status
   */
  status: number;

  /**
   * Output if false. Detailed error message that can be passed in the response
   */
  detailedError?: string;

  /**
   * The generated request for the provider
   */
  request?: string;

  /**
   * Header that can be used for the response
   */ 
  header?: {[key: string]: string};
}
