/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import ErrorHelpers from '../error_handling/ErrorHelpers';
import { ClaimToken } from '../index';
import { IValidationResponse } from './IValidationResponse';
const errorCode = (error: number) => ErrorHelpers.errorCode('VCSDKQuIt', error);

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
  private _validatedToken: ClaimToken | undefined;
  private validationStatus: ValidationStatus = ValidationStatus.todo;

  constructor(private _id: string, private _tokenToValidate: ClaimToken) {
    // Set defaults for validation result
    this._validationResult = {
      result: false,
      status: 500,
      code: errorCode(1),
      detailedError: 'Token not validated'
    };
  }

  /**
   * Keep track of the result of the validation
   * @param result of the validation
   */
  public setResult(result: IValidationResponse, token: ClaimToken) {
    this._validationResult = result;
    this._validatedToken = token;
    this.validationStatus = ValidationStatus.validated;
  }

  /**
   * Gets the validation response
   */
   public get validationResponse() {
    return this._validationResult;
  }

  /**
   * Gets the token id
   */
   public get id() {
    return this._id;
  }

  /**
   * Token to validate
   */
  public get tokenToValidate(): ClaimToken {
    return this._tokenToValidate;
  }

  /**
   * Validated token
   */
  public get validatedToken(): ClaimToken | undefined {
    return this._validatedToken;
  }

  /**
   * Return false if the token still needs to be validated or the validation failed
   */
  public get result(): boolean {
    return this.isValidated &&  this._validationResult.result;
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