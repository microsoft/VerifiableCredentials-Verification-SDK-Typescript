/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { count } from 'console';
import { Crypto, CryptoBuilder, JoseBuilder, IPayloadProtectionSigning, Requestor, IRequestorPresentationExchange, IRequestorAttestation, IRequestor } from '../index';
import { CorrelationVector } from '../tracing/CorrelationVector';

/**
 * Defines the presentation protcol
 */
export enum PresentationProtocol {
  /**
   * The presentation exchange protocol
   */
  presentationExchange,

  /**
   * The attestation presentation protocol
   */
  attestation
}

/**
 * Class to build an OIDC requestor
 */
export default class RequestorBuilder {

  private oidRequestExpirty: number = 5 * 60;
  private _state: string | undefined;
  private _nonce: string | undefined;
  private _issuance: boolean = false;
  private _crypto: Crypto = new CryptoBuilder().build();
  private _correlationVector = CorrelationVector.createCorrelationVector();

  /**
   * Create a new instance of RequestorBuilder
   * @param requestor Initializer for the requestor
   */
  constructor(public requestor: IRequestor, crypto?: Crypto) {
    if (crypto) {
      this._crypto = crypto;
    }

  }

  /**
   * Gets the crypto object
   */
  public get crypto() {
    return this._crypto;
  }

  /**
   * Gets the presentation protocol
   */
  public get presentationProtocol() {
    return (<IRequestorAttestation>this.requestor).attestations ? PresentationProtocol.attestation : PresentationProtocol.presentationExchange;
  }

  /**
   * Get the name of the requestor (Relying Party)
   */
  public get clientName() {
    return this.requestor.clientName;
  }

  /**
   * Get the requestor's purpose for the request
   */
  public get clientPurpose() {
    return this.requestor.clientPurpose;
  }

  /**
   * Get the url where the request came from
   */
  public get clientId() {
    return this.requestor.clientId;
  }

  /**
   * Get the url to send response to
   */
  public get redirectUri() {
    return this.requestor.redirectUri;
  }

  /**
   * Gets the url pointing to terms and service user can open in a webview
   */
  public get tosUri() {
    return this.requestor.tosUri;
  }

  /**
   * Gets the url pointing to logo of the requestor (Relying Party)
   */
  public get logoUri() {
    return this.requestor.logoUri;
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
   * Gets true if issuance is allowed
   */
  public get issuance() {
    return this._issuance;
  }

  /**
    * Sets the correlation vector
    * @param correlationVector The correlation vector
    * @returns The validator builder
    */
   public useCorrelationVector(correlationVector: string): RequestorBuilder {
    CorrelationVector.validateCorrelationVectorDuringCreation = false;
    this._correlationVector = CorrelationVector.parse(correlationVector);
    return this;
  }

  /**
    * Extends the correlation vector for a new transaction. 
    * @returns The validator builder
    */
   public extendCorrelationVector(): RequestorBuilder {
    CorrelationVector.validateCorrelationVectorDuringCreation = false;
    this._correlationVector = CorrelationVector.extend(this._correlationVector.value);
    return this;
  }

  /**
    * Increment the correlation vector for a new legs. 
    * @returns The validator builder
    */
   public incrementCorrelationVector(): RequestorBuilder {
    CorrelationVector.validateCorrelationVectorDuringCreation = false;
    this._correlationVector.increment();
    return this;
  }

  /**
   * Get the correlation vector for the request
   */
  public get correlationVector() {
    return this._correlationVector.value;
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

