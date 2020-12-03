/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { time } from "console";
import { RulesValidationError } from "../error_handling/RulesValidationError";
import { AuthenticationModel } from "./AuthenticationModel";

/**
 * Type that describes an object that maps a key to a value.
 */
export declare type DataProviderHeaders = {
  [header: string]: string;
};

/**
 * Data Model to describe external service authentication
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
    this._authentication = authentication;

    if (!id) {
      throw new RulesValidationError('missing required "id" property');
    }

    if (headers) {
      this.headers = headers;
    }

    if(timeoutInMilliseconds){
      this.timeoutInMilliseconds = timeoutInMilliseconds;
    }

    // the root authentication instance may be overridden
    if (input.authentication) {
      this._authentication = new AuthenticationModel();
      this._authentication.populateFrom(input.authentication);
    }

    // we must have a valid AuthenticationModel value set
    if (!this._authentication) {
      throw new RulesValidationError('authentication is not configured');
    }
  }
}