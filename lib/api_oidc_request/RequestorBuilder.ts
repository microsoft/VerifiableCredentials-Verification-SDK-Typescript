/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Crypto, CryptoBuilder, JoseBuilder, IPayloadProtectionSigning, Requestor, IRequestorPresentationExchange, IRequestorAttestation, IRequestor } from '../index';

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
  private _signingProtocol: IPayloadProtectionSigning;

  /**
   * Create a new instance of RequestorBuilder
   * @param requestor Initializer for the requestor
   */
  constructor(public requestor: IRequestor, crypto?: Crypto) {
    if (crypto) {
      this._crypto = crypto;
    }

    this._signingProtocol = new JoseBuilder(this._crypto).build();
  }

  /**
   * Gets the crypto object
   */
  public get crypto() {
    return this._crypto;
  }

  /**
   * Gets the signing protocol
   */
  public get signingProtocol() {
    return this._signingProtocol;
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

