/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Typed error for validation failures.
 */
export default class ValidationError extends Error {
  /**
   * Create a new instance of ValidationError
   * @param message describing the error message
   * @param code unique code the error
   */
  constructor(message: string, public code: string) {
    super(message);
  }
}
