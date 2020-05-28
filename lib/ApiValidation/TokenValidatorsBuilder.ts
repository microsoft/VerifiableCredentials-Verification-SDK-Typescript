/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Crypto, ITokenValidator, Validator, IDidResolver, ManagedHttpResolver, VerifiablePresentationTokenValidator, VerifiableCredentialTokenValidator, IdTokenTokenValidator, SiopTokenValidator, SelfIssuedTokenValidator, TrustedIssuerModel, TokenType } from '../index';

/**
 * Class to build the token validators for the different supported tokens
 */
export default class TokenValidatorsBuilder {
  private _tokenValidators: { [type: string]: ITokenValidator } = {};
  private vpValidator: VerifiablePresentationTokenValidator | undefined;
  private vcValidator: VerifiableCredentialTokenValidator | undefined;
  private idTokenValidator: IdTokenTokenValidator | undefined;
  private siopValidator: SiopTokenValidator | undefined;
  private siValidator: SelfIssuedTokenValidator | undefined;

  private _trustedIssuersForVerifiableCredentials: TrustedIssuerModel[] | undefined;
  private _trustedIssuerConfigurationsForIdTokens: TrustedIssuerModel[] | undefined;
  private _audienceUrl: string | undefined;
  
  constructor(private _crypto: Crypto) {

  }

  /**
   * Build the validators
   */
  /*
  public build(): { [type: string]: ITokenValidator } {
    this.siValidator = new SelfIssuedTokenValidator() <SelfIssuedTokenValidator>{type: TokenType.selfIssued}
  }
*/
  /**
   * Specify the trusted issuer for the verifiable credentials
   * @param issuers array of issuers
   */
  public useTrustedIssuersForVerifiableCredentials(issuers: TrustedIssuerModel[]): TokenValidatorsBuilder {
    this._trustedIssuersForVerifiableCredentials = issuers;
    return this;
  }

  /**
   * Specify the trusted issuer for the verifiable credentials
   * @param issuers array of issuers
   */
  public get trustedIssuersForVerifiableCredentials(): TrustedIssuerModel[] | undefined {
    return this._trustedIssuersForVerifiableCredentials;
  }

  /**
   * Specify the trusted issuer configuration endpoints for the OpenID Connect providers
   * @param issuers array of issuers
   */
  public useTrustedIssuerConfigurationsForIdTokens(issuers: TrustedIssuerModel[]): TokenValidatorsBuilder {
    this._trustedIssuerConfigurationsForIdTokens = issuers;
    return this;
  }

  /**
   * Specify the trusted issuer for the verifiable credentials
   * @param issuers array of issuers
   */
  public get trustedIssuerConfigurationsForIdTokens(): TrustedIssuerModel[] | undefined {
    return this._trustedIssuerConfigurationsForIdTokens;
  }

  /**
   * Specify the audience url of the validator
   * @param audience url of the validator
   */
  public useAudienceUrl(audience: string): TokenValidatorsBuilder {
    this._audienceUrl = audience;
    return this;
  }

  /**
   * Specify the trusted issuer for the verifiable credentials
   * @param issuers array of issuers
   */
  public get audienceUrl(): string | undefined {
    return this._audienceUrl;
  }
}

