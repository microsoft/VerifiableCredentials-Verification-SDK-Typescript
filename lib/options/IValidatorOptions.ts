/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDidResolver, Crypto, ValidationSafeguards } from '../index';
import IFetchRequest from '../tracing/IFetchRequest';

/**
* Interface to model the validator options
*/
export default interface IValidatorOptions {

  /**
   * The DID resolver
   */
  resolver: IDidResolver,

  /**
   * The fetch client
   */
  fetchRequest: IFetchRequest,

  /**
   * The validation safeguards
   */
  validationSafeguards: ValidationSafeguards,

  /**
   * Get the crypto options
   */
  crypto: Crypto,

  /**
   * Gets the error value of an invalid token
   */ 
  readonly invalidTokenError: number,
}
