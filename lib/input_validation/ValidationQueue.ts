/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import ValidationQueueItem from './ValidationQueueItem';
import { IValidationResponse } from './IValidationResponse';
import ClaimToken, { TokenType } from '../verifiable_credential/ClaimToken';

export default class ValidationQueue {

  /**
   * Keeps track of all tokens to validate and the results of validated tokens
   */
  private queue: ValidationQueueItem[] = [];

  /**
   * Add token to validation queue
   * @param token to add to queue
   */
  public enqueueToken(id: string, token: ClaimToken) {
    this.queue.push(new ValidationQueueItem(id, token));
  }

  
  /**
   * Add token to validation queue
   * @param node item to add to queue
   */
  public enqueueItem(node: ValidationQueueItem){
    this.queue.push(node);
  }

  /**
   * Gets the queue
   * @param token to add to queue
   */
  public get items(): ValidationQueueItem[] {
    return this.queue;
  }

  /**
   * Get next token to validate from the queue
   */
  public getNextToken(): ValidationQueueItem | undefined {
    for (let inx = 0 ; inx < this.queue.length; inx ++) {
      if (!this.queue[inx].isValidated) {
        return this.queue[inx];
      }
    }
    // No more tokens to validate
    return undefined;
  }

  /**
   * Get the result of the validation
   */
  public getResult(): IValidationResponse {
    for (let inx = this.queue.length - 1 ; inx >= 0; inx --) {
      const item = this.queue[inx];
      if (!item.result) {
        return item.validationResponse;
      }
    }

    // No failures. Return last item
    return this.queue[this.queue.length - 1].validationResponse;
  }
}