/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType } from '../index';

/**
 * Type for delegates to validate certain value in the token
 */
export type CheckTokenProperty = (property: any) => boolean;

export default interface IExpected {
  /**
   * The token type
   */
  type: TokenType,

  /**
   * Expected issuers for the token type (iss). 
   * Configuration url for id tokens. The actual issuer is found in the issuer property of the configuration data.
   */
  issuers?: string[],

  /**
   * Expected audience for the token type
   */
  audience?: string ,

  /**
   * Verifiable credentials will use contracts to define their type
   */
  contracts?: string[],
  
}