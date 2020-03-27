/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType } from '../index';

export default interface IExpected {
  /**
   * The token type
   */
  type: TokenType,

  /**
   * Expected issuers for the token type
   */
  issuers?: string[],

  /**
   * Expected audience for the token type
   */
  audience?: string,

  /**
   * Verifiable credentials will use schema to define their type
   */
  schemas?: string[],
  
  /**
   * Id tokens will use configurations to find the public key
   */
  configurations?: string[]
}