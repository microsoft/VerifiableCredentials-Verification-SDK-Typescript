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
   * 
   * @param _id the id of the provider which must be a url
   * @param _authentication the authentication scheme of the provider
   * @param headers headers to send in the request
   * @param timeoutInMilliseconds the timeout for the external call
   */
  constructor(
    private _id?: string,
    private _authentication?: AuthenticationModel,
    public headers: DataProviderHeaders = {},
    public timeoutInMilliseconds: number = 500) {
  }

  /**
   * gets the id value
   */
  public get id(): string {
    return this._id!;
  }

  /**
   * gets the AuthenticationModel value
   */
  public get authentication(): AuthenticationModel {
    return this._authentication!;
  }

  toJSON(): any {
    return {
      id: this.id,
      authentication: this.authentication,
      headers: this.headers,
      timeoutInMilliseconds: this.timeoutInMilliseconds,
    };
  }

  /**
   * Populate an instance of AuthenticationModel from any instance
   * @param input object instance to populate from
   * @param authentication AuthenticationModel instance from the parent object
   */
  populateFrom(input: any, authentication?: AuthenticationModel): void {
    const { id, headers, timeoutInMilliseconds } = input;

    if (!id) {
      throw new RulesValidationError('missing required "id" property');
    }

    if (headers) {
      this.headers = headers;
    }

    if (timeoutInMilliseconds) {
      this.timeoutInMilliseconds = timeoutInMilliseconds;
    }

    this._id = id;

    // the root authentication instance may be overridden
    if (input.authentication) {
      this._authentication = AuthenticationModel.fromJSON(input.authentication);
    } else if (authentication) {
      this._authentication = authentication;
    } else {
      // we must have a valid AuthenticationModel value set
      throw new RulesValidationError('authentication is not configured');
    }
  }
}