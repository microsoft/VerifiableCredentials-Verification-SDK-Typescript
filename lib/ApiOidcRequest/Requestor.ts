/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IResponse, RequestorBuilder } from '../index';
import { KeyReferenceOptions } from '@microsoft/crypto-sdk';

/**
 * Class to model the OIDC requestor
 */
export default class Requestor {
  private _payload: any = {};

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
    this._payload = {
      response_type: 'idtoken',
      response_mode: 'form_post',
      client_id: this.builder.clientId,
      redirect_uri: this.builder.redirectUri,
      iss: this.builder.issuer,
      scope: 'openid did_authn',
      state: state || this.builder.state,
      nonce: nonce || this.builder.nonce,
      attestations: this.builder.attestation,
      prompt: 'create',
      registration: {
        client_name: this.builder.clientName,
        client_purpose: this.builder.clientPurpose,
        tos_uri: this.builder.tosUri
      }
    };

    // Add optional fields
    if (this.builder.logoUri) {
      this._payload.logo_uri = this.builder.logoUri;
    }

    const crypto = this.builder.crypto.builder;
    const key = crypto.signingKeyReference;
    const signature = await crypto.payloadProtectionProtocol.sign(
      new KeyReferenceOptions({ keyReference: key, extractable: true }),
      Buffer.from(JSON.stringify(this._payload)),
      'JwsCompactJson',
      crypto.payloadProtectionOptions);

    const response = {
      result: true,
      status: 200,
      request: signature.serialize()
    };

    return response;
  }
}

