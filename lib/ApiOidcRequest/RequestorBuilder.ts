/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Requestor, IssuanceAttestationsModel, Crypto } from '../index';

/**
 * Class to build an OIDC requestor
 */
export default class RequestorBuilder {

  private vpExpirty: number | undefined;
  private _state: string | undefined;
  private _nonce: string | undefined;

  /**
   * Create a new instance of RequestorBuilder
   * @param _clientName the name of the requestor (Relying Party)
   * @param _clientPurpose the name of the requestor (Relying Party)
   * @param _clientId the url where the request came from
   * @param _redirectUri url to send response to
   * @param _issuer DID of the requestor (Relying Party)
   * @param _tosUri url pointing to terms and service user can open in a webview
   * @param _logoUri url pointing to logo of the requestor (Relying Party)
   * @param _attestation claims being asked for
   */
  constructor(
    private _crypto: Crypto,
    private _clientName: string,
    private _clientPurpose: string[],
    private _clientId: string,
    private _redirectUri: string,
    private _issuer: string,
    private _tosUri: string[],
    private _logoUri: string[],
    private _attestation: IssuanceAttestationsModel
    ) {
  }
//#region constructor properties

  /**
   * Gets the crypto object
   */
  public get crypto() {
    return this._crypto;
  }

  /**
   * Get the name of the requestor (Relying Party)
   */
  public get clientName() {
    return this._clientName;
  }

  /**
   * Get the requestor's purpose for the request
   */
  public get clientPurpose() {
    return this._clientPurpose;
  }

  /**
   * Get the url where the request came from
   */
  public get clientId() {
    return this._clientId;
  }

  /**
   * Get the url to send response to
   */
  public get redirectUri() {
    return this._redirectUri;
  }

  /**
   * Get the DID of the requestor (Relying Party)t
   */
  public get issuer() {
    return this._issuer;
  }

  /**
   * Gets the url pointing to terms and service user can open in a webview
   */
  public get tosUri() {
    return this._tosUri;
  }

  /**
   * Gets the url pointing to logo of the requestor (Relying Party)
   */
  public get logoUri() {
    return this._logoUri;
  }

  /**
   * Gets the claims being asked for
   */
  public get attestation() {
    return this._attestation;
  }
  //#endregion
  
 /**
   * Sets the vp expiry
   * @param vpExpiry The verifiable presentation expiry
   * @returns The validator builder
   */
  public useVerifiablePresentationExpiry(expiry: number): RequestorBuilder {
    this.vpExpirty = expiry;
    return this;
  }
 
 /**
   * Gets the vp expiry
   */
  public get verifiablePresentationExpiry(): number | undefined {
    return this.vpExpirty;
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

