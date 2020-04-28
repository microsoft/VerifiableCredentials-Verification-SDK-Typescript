/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITokenValidator, Validator, IDidResolver, ManagedHttpResolver } from '../index';
import VerifiableCredentialConstants from '../VerifiableCredential/VerifiableCredentialConstants';
import Requestor from './Requestor';

/**
 * Class to build an OIDC requestor
 */
export default class RequestorBuilder {

  constructor(
    private _clientId: string,
    private _redirectUri: string,
    private _issuer: string,
    private _state: string,
    private _nonce: string,
    ) {
  }

  /**
   * Get the redirect uri for the request
   */
  public get clientId() {
    return this._clientId;
  }
  
  /**
   * Get the client id for the request
   */
  public get redirectUri() {
    return this._redirectUri;
  }

  /**
   * Get the issuer for the request
   */
  public get issuer() {
    return this._issuer;
  }

  /**
   * Get the state for the request
   */
  public get state() {
    return this._state;
  }

  /**
   * Get the nonce for the request
   */
  public get nonce() {
    return this._nonce;
  }

  /**
   * Build the requestor
   */
  public build(): Requestor {
    return new Requestor(this);
  }
}

