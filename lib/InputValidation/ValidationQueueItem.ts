/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ClaimToken, IExpected, IDidResolver, CryptoOptions, ITokenValidator } from '../index';
import { IValidationResponse } from './IValidationResponse';

export enum ValidationStatus {
  /**
   * Item needs validation
   */
  todo = 'todo',

  /**
   * Item is validated
   */
  validated = 'validated',

  /**
   * Item is under validated
   */
  underValidation = 'underValidation',
}

export default class ValidationQueueItem {
  private _validationResult: IValidationResponse;
  private validationStatus: ValidationStatus = ValidationStatus.todo;

  constructor(private _token: string) {
    // Set defaults for validation result
    this._validationResult = {
      result: false,
      status: 500,
      detailedError: 'Token not validated'
    };
  }

  /**
   * Keep track of the result of the validation
   * @param result of the validation
   */
  public setResult(result: IValidationResponse) {
    this._validationResult = result;
    this.validationStatus = ValidationStatus.validated;
  }

  /**
   * Gets the validation response
   */
  public get validationResponse() {
    return this._validationResult;
  }

  /**
   * Token to validate
   */
  public get token(): string {
    return this._token;
  }

  /**
   * Return false if the token still needs to be validated or the validation failed
   */
  public get result(): boolean {
    return !this.isValidated &&  this._validationResult.result;
  }

  /**
   * True if the queue item has been validated
   */
  public get isValidated(): boolean {
    return this.validationStatus === ValidationStatus.validated;
  }

  /**
   * True if the queue item is under validation
   */
  public get isUnderValidation(): boolean {
    return this.validationStatus === ValidationStatus.underValidation;
  }
}