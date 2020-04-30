/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Requestor, IssuanceAttestationsModel } from '../index';

/**
 * Class to build an OIDC requestor
 */
export default class RequestorBuilder {

  private vpExpirty: number | undefined;
  private _state: string | undefined;
  private _nonce: string | undefined;

  constructor(
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

  /**
   * Get the client name for the request
   */
  public get clientName() {
    return this._clientName;
  }

  /**
   * Get the client purpose for the request
   */
  public get clientPurpose() {
    return this._clientPurpose;
  }

  /**
   * Gets the url pointing to terms and service user can open in a webview
   */
  public get tosUri() {
    return this._tosUri;
  }

  /**
   * Gets the claims being asked for
   */
  public get attestation() {
    return this._attestation;
  }

  /**
   * Gets the url pointing to logo of relying party
   */
  public get logoUri() {
    return this._logoUri;
  }

  /**
   * Get the client id for the request
   */
  public get clientId() {
    return this._clientId;
  }
  
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
   * Get the redirect uri for the request
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

