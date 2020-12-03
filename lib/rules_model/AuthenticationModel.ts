/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RulesValidationError } from "../error_handling/RulesValidationError";

/**
 * Defines the presentation protcol
 */
export enum AuthenticationScheme {
  /**
   * basic authentication in the authorization header aka RFC 7617
   */
  basic = "basic",

  /**
   * use a shared secret in a custom header
   */
  sharedSecret = "sharedSecret",

  /**
   * use did authentication
   */
  did = "did",

  /**
   * use did authentication with proof of possession
   */
  didPop = "didPop",
}

/**
 * Data Model to describe external service authentication
 */
export class AuthenticationModel {

  /**
   * 
   * @param type the type of shared secret
   * @param secret absolute url to the secret including the version
   * @param header the header used to transmit the secret when sharedSecret is being used
   */
  constructor(
    public readonly type: AuthenticationScheme,
    public readonly secret: string,
    public readonly header?: string)
    {          
    }

  /**
   * Populate an instance of AuthenticationModel from any instance
   * @param input object instance to populate from
   */
  static fromJSON(input: any): AuthenticationModel {
    const { header, secret, type } = input;

    if (!secret) {
      throw new RulesValidationError('missing required "secret" property');
    }

    if (!type) {
      throw new RulesValidationError('missing required "type" property');
    }

    if (!Object.values(AuthenticationScheme).includes(type)) {
      throw new RulesValidationError(`${type} is not a valid AuthenticationScheme value`)
    }

    return new AuthenticationModel(type, secret, header);
  }
}