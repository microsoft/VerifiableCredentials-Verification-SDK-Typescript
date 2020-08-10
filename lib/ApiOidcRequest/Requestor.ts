/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IResponse, RequestorBuilder, IRequestorAttestation, IRequestorPresentationExchange } from '../index';
import { PresentationProtocol } from './RequestorBuilder';

/**
 * Class to model the OIDC requestor
 */
export default class Requestor {
  private _payload: any = {};


  /**
   * Create instance of <see @class Requestor>
   * @param _builder The builder object
   */
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
   * Gets the payload for the request
   */
  public get payload(): any {
    return this._payload;
  }

  /**
   * Create the actual request
   */
  public async create(state?: string, nonce?: string): Promise<IResponse> {
    const crypto = this.builder.crypto.builder;
    this._payload = {
      response_type: 'idtoken',
      response_mode: 'form_post',
      client_id: this.builder.clientId,
      redirect_uri: this.builder.redirectUri,
      scope: 'openid did_authn',
      state: state || this.builder.state,
      nonce: nonce || this.builder.nonce,
      iss: crypto.did,
      registration: {
        client_name: this.builder.clientName,
        client_purpose: this.builder.clientPurpose,
        tos_uri: this.builder.tosUri
      }
    };

    // Add optional fields
    const current = Math.trunc(Date.now() / 1000);
    const iat = current;
    let expiry = iat + this.builder.OidcRequestExpiry;
    this._payload.iat = iat;
    this._payload.exp = expiry;

    const issuance: boolean | undefined = this.builder.issuance;
    if (issuance) {
      this._payload.prompt = 'create';
    }

    if (this.builder.logoUri) {
      this._payload.registration.logo_uri = this.builder.logoUri;
    }

    // Add protocol specifics
    this._payload = this.builder.presentationProtocol === PresentationProtocol.attestation ?
      this.createAttestationPresentationRequest(this._payload) :
      this.createPresentationExchangeRequest(this._payload);

    const key = crypto.signingKeyReference;
    const signature = await this.builder.signingProtocol.sign(Buffer.from(JSON.stringify(this._payload)));

    const response = {
      result: true,
      status: 200,
      request: signature.serialize()
    };

    return response;
  }

  /**
   * Create the presentation exchange request
   */
  public createPresentationExchangeRequest(payload: any): any {
    payload.presentation_definition = (<IRequestorPresentationExchange>this.builder.requestor).presentationDefinition;
    return payload;
  }

  /**
   * Create the attestation presentation request
   */
  public createAttestationPresentationRequest(payload: any): any {
    payload.attestations = (<IRequestorAttestation>this.builder.requestor).attestation;
    return payload;
  }
}

