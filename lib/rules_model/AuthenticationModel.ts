/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RulesValidationError } from "..";

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
  didPop = "didpop",
}

/**
 * Data Model to describe external service authentication
 */
export class AuthenticationModel {
  /**
   * 
   * @param _type the type of shared secret
   * @param _secret absolute url to the secret including the version
   * @param _header the header used to transmit the secret when sharedSecret is being used
   */
  constructor(
    private  _type?: AuthenticationScheme,
    private  _secret?: string,
    private  _header?: string,
  ) {
  }

  /**
   * gets the header value
   */
  public get header(): string | undefined{
    return this._header;
  }

  /**
   * gets the AuthenticationScheme value
   */
  public get type(): AuthenticationScheme{
    return this._type!;
  }

  /**
   * gets the secret value
   */
  public get secret(): string{
    return this._secret!;
  }

  toJSON() : any{
    return {
      type: this.type,
      secret: this.secret,
      header: this.header,
    };
  }

  /**
   * Populate an instance of AuthenticationModel from any instance
   * @param input object instance to populate from
   */
  populateFrom(input: any): void {
    const { header, secret, type } = input;

    if(!secret){
      throw new RulesValidationError('missing required "secret" property');
    }

    if(!type){
      throw new RulesValidationError('missing required "type" property');
    }

    if(!Object.values(AuthenticationScheme).includes(type)){
      throw new RulesValidationError(`${type} is not a valid AuthenticationScheme value`)
    }

    this._type = type;
    this._secret = secret;
    this._header = header;
 }
}