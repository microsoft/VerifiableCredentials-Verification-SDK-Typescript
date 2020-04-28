/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IResponse } from "../InputValidation/IValidationResponse";
import RequestorBuilder from "./RequestorBuilder";

/**
 * Class to model the OIDC requestor
 */
export default class Requestor {

  constructor(
    private _builder: RequestorBuilder) {
  } 

  /**
   * Gets the builder for the request
   */
  public get builder(): RequestorBuilder {
    return this._builder;
  }

  /**
   * Create the actual request
   */
  public async create(): Promise<IResponse> {
    return new Promise((resolve) => {
      resolve({
        status: 200,
        result: true
      });
    })
  }

}

