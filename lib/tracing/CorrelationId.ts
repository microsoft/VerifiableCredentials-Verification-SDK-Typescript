/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { CorrelationVector } from './CorrelationVector';
import ICorrelationId from './ICorrelationId';

export default class CorrelationId implements ICorrelationId {
  private _correlationVector = CorrelationVector.createCorrelationVector();

  /**
   * Create a new instance of CorrelationId
   * @param correlationId Initial value for the correlation id
   */
  constructor(correlationId?: string) {
    CorrelationVector.validateCorrelationVectorDuringCreation = false;
    if (correlationId) {
      this._correlationVector = CorrelationVector.parse(correlationId);
    }
  }

  /**
   * Gets the current correlation id
   */
  public get correlationId(): string {
    return this._correlationVector.value
  }

  /**
   * Extend the correlation id for a new transaction
   */
  public extend(): string {
    this._correlationVector = CorrelationVector.extend(this._correlationVector.value)
    return this._correlationVector.value;
  }

  /**
   * Increment the correlation id for a new leg
   */
  public increment(): string {
    this._correlationVector.increment();
    return this._correlationVector.value;
  }
}