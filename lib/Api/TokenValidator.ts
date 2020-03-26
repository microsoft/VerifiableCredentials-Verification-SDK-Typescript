/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType } from '../index';

/**
 * Class to validate a token
 */
export default class TokenValidator {
  
  /**
   * Create new instance of <see @class TokenValidator>
   * @param tokenType The type to valildate
   */
  constructor (private tokenType: TokenType) {
  }

  /**
   * Gets the type of token to validate
   */
  public get isType(): TokenType {
    return this.tokenType;
  }
}

