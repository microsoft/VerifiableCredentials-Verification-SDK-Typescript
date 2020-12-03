/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RulesValidationError } from "../error_handling/RulesValidationError";
import { AuthenticationModel } from "./AuthenticationModel";

/**
 * Type that describes an object that maps a key to a value.
 */
export type DataProviderHeaders = {
  [header: string]: string;
};

/**
 * Data Model to describe external service data providers
 */
export class DataProviderModel {
  /**
   * Default timeout for external calls
   */
  public static readonly defaultTimeoutInMilliseconds = 500;

  /**
   * 
   * @param id the id of the provider which must be a url
   * @param authentication the authentication scheme of the provider
   * @param headers headers to send in the request
   * @param timeoutInMilliseconds the timeout for the external call
   */
  constructor(
    public readonly id: string,
    public readonly authentication: AuthenticationModel,
    public readonly headers: DataProviderHeaders = {},
    public readonly timeoutInMilliseconds: number = DataProviderModel.defaultTimeoutInMilliseconds) {
  }

  /**
   * Populate an instance of DataProviderModel from any instance
   * @param input object instance to populate from
   * @param authentication AuthenticationModel instance from the parent object
   */
  static fromJSON(input: any, authentication?: AuthenticationModel): DataProviderModel {
    const { id, authentication: inputAuthentication, headers = {}, timeoutInMilliseconds = DataProviderModel.defaultTimeoutInMilliseconds } = input;
    const authenticationInstance = inputAuthentication ? AuthenticationModel.fromJSON(inputAuthentication) : authentication;

    if (!id) {
      throw new RulesValidationError('missing required "id" property');
    }

    if (!authenticationInstance) {
      // we must have a valid AuthenticationModel value set
      throw new RulesValidationError('authentication is not configured');
    }

    return new DataProviderModel(id, authenticationInstance, headers, timeoutInMilliseconds);
  }
}