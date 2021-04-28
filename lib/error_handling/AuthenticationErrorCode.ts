/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export enum AuthenticationErrorCode {
  /**
   * Error code for a missing or malformed token
   * Unable to validate a token
   * https://tools.ietf.org/html/rfc6750#section-3.1
   */
  invalidRequest = 'invalid_request',

  /**
   * Error code for a invalid (e.g. expired, revoked) token
   * Inflection point is that there was a valid attempt to validate a token
   * https://tools.ietf.org/html/rfc6750#section-3.1
   */
  invalidToken = 'invalid_token',
}

export enum AuthenticationErrorDescription {
  /**
   * When an expected token is malformed such as a jwt that is not a jwt or a json that does not parse
   */
  malformedToken = 'The token is malformed',
}
