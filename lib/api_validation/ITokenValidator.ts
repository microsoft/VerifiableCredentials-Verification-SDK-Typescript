/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType } from '../index';
import { IValidationResponse } from '../input_validation/IValidationResponse';
import ValidationQueue from '../input_validation/ValidationQueue';
import ValidationQueueItem from '../input_validation/ValidationQueueItem';

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
   * @param queue with tokens to validate
   * @param queueItem under validation
   */
  validate(queue: ValidationQueue, queueItem: ValidationQueueItem, siopDid?: string, siopContract?: string): Promise<IValidationResponse>;
}

