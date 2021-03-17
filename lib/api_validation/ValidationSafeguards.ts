/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Interface defining all safeguards for validation
 */
export interface IValidationSafeguards {
  maxNumberOfVPTokensInSiop: number,
  maxSizeOfVPTokensInSiop: number,
  maxNumberOfVCTokensInPresentation: number,
  maxSizeOfVCTokensInPresentation: number,
  maxNumberOfIdTokensInSiop: number,
  maxSizeOfIdToken: number
}

/**
 * Class to define the safeguards used during validation of tokens
 */
export default class ValidationSafeguards {

  private _maxNumberOfVPTokensInSiop: number;
  private _maxSizeOfVPTokensInSiop: number;
  private _maxNumberOfVCTokensInPresentation: number;
  private _maxSizeOfVCTokensInPresentation: number;
  private _maxNumberOfIdTokensInSiop: number;
  private _maxSizeOfIdToken: number;

  constructor(safeguards?: IValidationSafeguards) {
    this._maxNumberOfVPTokensInSiop = safeguards?.maxNumberOfVPTokensInSiop || 10;
    this._maxSizeOfVPTokensInSiop = safeguards?.maxSizeOfVPTokensInSiop || 16 * 1024 * 1024;
    this._maxNumberOfVCTokensInPresentation = safeguards?.maxNumberOfVCTokensInPresentation || 1;
    this._maxSizeOfVCTokensInPresentation = safeguards?.maxSizeOfVCTokensInPresentation || 16 * 1024 * 1024;
    this._maxNumberOfIdTokensInSiop = safeguards?.maxNumberOfIdTokensInSiop || 1;
    this._maxSizeOfIdToken = safeguards?.maxSizeOfIdToken || 16 * 1024 * 1024;
  }

  /**
   * Gets the maximum number of VP tokens in a SIOP
   */
  public get maxNumberOfVPTokensInSiop() {
    return this._maxNumberOfVPTokensInSiop;
  }

  /**
   * Sets the maximum number of VP tokens in a SIOP
   */
  public set maxNumberOfVPTokensInSiop(value: number) {
    this._maxNumberOfVPTokensInSiop = value;
  }

  /**
   * Gets the maximum number of VP tokens in a SIOP
   */
  public get maxNumberOfVCTokensInPresentation() {
    return this._maxNumberOfVCTokensInPresentation;
  }

  /**
   * Sets the maximum number of VP tokens in a SIOP
   */
  public set maxNumberOfVCTokensInPresentation(value: number) {
    this._maxNumberOfVCTokensInPresentation = value;
  }

  /**
   * Gets the maximum number of VP tokens in a SIOP
   */
  public get maxSizeOfVPTokensInSiop() {
    return this._maxSizeOfVPTokensInSiop;
  }

  /**
   * Sets the maximum number of VP tokens in a SIOP
   */
  public set maxSizeOfVPTokensInSiop(value: number) {
    this._maxSizeOfVPTokensInSiop = value;
  }

  /**
   * Gets the maximum number of VP tokens in a SIOP
   */
  public get maxSizeOfVCTokensInPresentation() {
    return this._maxSizeOfVCTokensInPresentation;
  }

  /**
   * Sets the maximum number of VP tokens in a SIOP
   */
  public set maxSizeOfVCTokensInPresentation(value: number) {
    this._maxSizeOfVCTokensInPresentation = value;
  }

  /**
   * Gets the maximum number of VP tokens in a SIOP
   */
  public get maxNumberOfIdTokensInSiop() {
    return this._maxNumberOfIdTokensInSiop;
  }

  /**
   * Sets the maximum number of VP tokens in a SIOP
   */
  public set maxNumberOfIdTokensInSiop(value: number) {
    this._maxNumberOfIdTokensInSiop = value;
  }

  /**
   * Gets the maximum number of VP tokens in a SIOP
   */
  public get maxSizeOfIdToken() {
    return this._maxSizeOfIdToken;
  }

  /**
   * Sets the maximum number of VP tokens in a SIOP
   */
  public set maxSizeOfIdToken(value: number) {
    this._maxSizeOfIdToken = value;
  }
}