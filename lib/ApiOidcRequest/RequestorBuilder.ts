/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Requestor, IssuanceAttestationsModel, Crypto } from '../index';
import IRequestor from './IRequestor';

/**
 * Class to build an OIDC requestor
 */
export default class RequestorBuilder {

  private oidRequestExpirty: number = 5 * 60;
  private _state: string | undefined;
  private _nonce: string | undefined;
  private _issuance: boolean = false;

  /**
   * Create a new instance of RequestorBuilder
   * @param _requestor Initializer for the requestor
   */
  constructor(private _requestor: IRequestor) {
  }

  /**
   * Gets the crypto object
   */
  public get crypto() {
    return this._requestor.crypto;
  }

  /**
   * Get the name of the requestor (Relying Party)
   */
  public get clientName() {
    return this._requestor.clientName;
  }

  /**
   * Get the requestor's purpose for the request
   */
  public get clientPurpose() {
    return this._requestor.clientPurpose;
  }

  /**
   * Get the url where the request came from
   */
  public get clientId() {
    return this._requestor.clientId;
  }

  /**
   * Get the url to send response to
   */
  public get redirectUri() {
    return this._requestor.redirectUri;
  }

  /**
   * Gets the url pointing to terms and service user can open in a webview
   */
  public get tosUri() {
    return this._requestor.tosUri;
  }

  /**
   * Gets the url pointing to logo of the requestor (Relying Party)
   */
  public get logoUri() {
    return this._requestor.logoUri;
  }

  /**
   * Gets the claims being asked for
   */
  public get attestation() {
    return this._requestor.attestation;
  }
  //#endregion
  
 /**
   * Sets the OIDC request expiry
   * @param expiry The OIDC request expiry
   * @returns The validator builder
   */
  public useOidcRequestExpiry(expiry: number): RequestorBuilder {
    this.oidRequestExpirty = expiry;
    return this;
  }
 
 /**
   * Gets the OIDC request expiry
   */
  public get OidcRequestExpiry(): number {
    return this.oidRequestExpirty;
  }
  
 /**
   * Sets the state
   * @param state The state for the request
   * @returns The validator builder
   */
  public useState(state: string): RequestorBuilder {
    this._state = state;
    return this;
  }

  /**
   * Get the state for the request
   */
  public get state() {
    return this._state;
  }
  
 /**
   * Sets the allowIssuance property. 
   * @returns The validator builder
   */
  public allowIssuance(): RequestorBuilder {
    this._issuance = true;
    return this;
  }

  /**
   * Get the nonce for the request
   */
  public get issuance() {
    return this._issuance;
  }

  /**
    * Sets the nonce
    * @param nonce The nonce for the request
    * @returns The validator builder
    */
   public useNonce(nonce: string): RequestorBuilder {
     this._nonce = nonce;
     return this;
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

