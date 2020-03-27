/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType, IExpected, ClaimToken } from '../index';
import { IValidationResponse } from '../InputValidation/IValidationResponse';
import IValidatorOptions from '../Options/IValidatorOptions';

/**
 * Interface to validate a token
 */
export default interface ITokenValidator {
  /**
   * Gets the type of token to validate
   */
  isType: TokenType;
  
  /**
   * Validate the token
   * @param validatorOption The options used during validation
   * @param token to validate
   * @param expected values to find in the token to validate
   */
  validate(validatorOption: IValidatorOptions, token: ClaimToken, expected: IExpected): Promise<IValidationResponse>;
}

