/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RequestorBuilder, IRequestorAttestation, IRequestorPresentationExchange, IssuerMap, IssuanceAttestationsModel, IdTokenAttestationModel, VerifiablePresentationAttestationModel, ValidationError } from '../index';
import { PresentationProtocol } from './RequestorBuilder';
import { IRequestorResult } from './IRequestorResult';
import { JoseBuilder } from 'verifiablecredentials-crypto-sdk-typescript';
import ErrorHelpers from '../error_handling/ErrorHelpers';
const errorCode = (error: number) => ErrorHelpers.errorCode('VCSDKREQU', error);

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
   * @param state The state for the transactions
   * @param nonce The nonce for the transaction
   */
  public async create(state?: string, nonce?: string): Promise<IRequestorResult> {
    const crypto = this.builder.crypto.builder;
    this._payload = {
      response_type: 'id_token',
      response_mode: 'form_post',
      client_id: this.builder.redirectUri,
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
    const signature = await crypto
      .build()
      .signingProtocol(JoseBuilder.JWT)
      .sign(this._payload);
      
    const token = await signature.serialize();

    const response = {
      result: true,
      status: 200,
      request: token
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
    payload.attestations = (<IRequestorAttestation>this.builder.requestor).attestations;
    return payload;
  }

  /**
   * Get the audience url from the requestor
   */
  public audienceUrl(): string {
    return this.builder.redirectUri || this.builder.clientId;
  }

  /**
   * Get the trusted issuer's configuration urls from the requestor
   */
  public trustedIssuerConfigurationsForIdTokens(): IssuerMap {
    const attestations: IssuanceAttestationsModel = (<IRequestorAttestation>this.builder.requestor).attestations;
    if (attestations) {
      if (!attestations.idTokens) {
        return [];
      } else {
        const configurations = attestations.idTokens.map((idToken: IdTokenAttestationModel) => {
          return idToken.configuration;
        });

        return <string[]>configurations.filter((config: string | undefined) => config);
      }
    } else {
      throw new ValidationError(`Id Tokens only supported in Attestation Requestor model.`, errorCode(1));
    }
  }

  /**
   * Get the trusted issuer's configuration urls from the requestor
   */
  public trustedIssuersForVerifiableCredentials(): { [credentialType: string]: string[] } | undefined {
    const issuers: { [credentialType: string]: string[] } = {};

    if (this.isPresentationExchange()) {
      /*
      const presentationDefinition = (<IRequestorPresentationExchange>this.builder.requestor).presentationDefinition;
      if (!presentationDefinition.input_descriptors) {
        return { undefined: [] };
      }
      const issuers: { [credentialType: string]: string[] } = {};
      for (let definition in presentationDefinition.input_descriptors) {
        if (!presentationDefinition.input_descriptors[definition]) {
          throw new ValidationError('Missing id in input_descriptor');
        }
      }
      return issuers;
      */
     throw new ValidationError('trustedIssuersForVerifiableCredentials not supported for presentation exchange. Requires constraints.', errorCode(2));
    } else {
      const attestations = (<IRequestorAttestation>this.builder.requestor).attestations;
      if (!attestations.presentations) {
        return { undefined: [] };
      } else {
        attestations.presentations.forEach((presentation) => {

          if (!presentation.credentialType) {
            throw new ValidationError('Missing credentialType for presentation.', errorCode(3));
          }
          if (!issuers[presentation.credentialType]) {
            issuers[presentation.credentialType] = [];
          }

          presentation.issuers?.forEach((issuer) => issuers[presentation.credentialType!].push(<string>issuer.iss));
        });

        return issuers;
      }
    }
  }


  public isPresentationExchange(): boolean {
    return (<IRequestorAttestation>this.builder.requestor).attestations === undefined;
  }
}

