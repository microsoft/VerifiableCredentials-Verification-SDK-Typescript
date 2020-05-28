/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITokenValidator, Validator, IDidResolver, ManagedHttpResolver, VerifiablePresentationTokenValidator, VerifiableCredentialTokenValidator, IdTokenTokenValidator, SiopTokenValidator, SelfIssuedTokenValidator, TokenType, IValidatorOptions } from '../index';
import VerifiableCredentialConstants from '../VerifiableCredential/VerifiableCredentialConstants';
import { Crypto } from '../index';
import { IExpectedIdToken, IExpectedSelfIssued, IExpectedVerifiableCredential, IExpectedVerifiablePresentation, IExpectedSiop } from '../Options/IExpected';

/**
 * Class to build a token validator
 */
export default class ValidatorBuilder {
  private _tokenValidators: ({ [type: string]: ITokenValidator }) | undefined;
  private _resolver: IDidResolver = new ManagedHttpResolver(VerifiableCredentialConstants.UNIVERSAL_RESOLVER_URL);
  private vpValidator: VerifiablePresentationTokenValidator | undefined;
  private vcValidator: VerifiableCredentialTokenValidator | undefined;
  private idTokenValidator: IdTokenTokenValidator | undefined;
  private siopValidator: SiopTokenValidator | undefined;
  private siValidator: SelfIssuedTokenValidator | undefined;


  private _trustedIssuersForVerifiableCredentials: string[] | undefined;
  private _trustedIssuerConfigurationsForIdTokens: string[] | undefined;
  private _audienceUrl: string | undefined;

  constructor(private _crypto: Crypto) {
  }

  /**
   * Gets the crypto object
   */
  public get crypto() {
    return this._crypto;
  }

  /**
   * Build the validator
   */
  public build(): Validator {
    return new Validator(this);
  }

  /**
   * Sets the token validator
   * @param validator The token validator
   * @returns The validator builder
   */
  public useValidators(validators: ITokenValidator[] | ITokenValidator): ValidatorBuilder {
    const validatorArray = validators as ITokenValidator[];
    this._tokenValidators = {};

    if (validatorArray.length) {
      for (let inx = 0; inx < validatorArray.length; inx++) {
        this._tokenValidators[validatorArray[inx].isType] = validatorArray[inx];
      }
    } else {
      this._tokenValidators[(validators as ITokenValidator).isType] = (validators as ITokenValidator);
    }

    return this;
  }

  /**
   * Gets the token validators
   */
  public get tokenValidators(): { [type: string]: ITokenValidator } {
    // check if default validators need to be instantiated
    if (!this._tokenValidators) {
      const validatorOptions: IValidatorOptions = {
        resolver: this.resolver,
        crypto: this._crypto
      };

      this._tokenValidators = {
        selfIssued: new SelfIssuedTokenValidator(validatorOptions, <IExpectedSelfIssued> {type: TokenType.selfIssued}),
        idToken: new IdTokenTokenValidator(validatorOptions, <IExpectedIdToken> {type: TokenType.idToken, configuration: <string[]>this._trustedIssuerConfigurationsForIdTokens}),
        verifiableCredential: new VerifiableCredentialTokenValidator(validatorOptions, <IExpectedVerifiableCredential> {type: TokenType.verifiableCredential, contractIssuers: this._trustedIssuersForVerifiableCredentials}),
        verifiablePresentation: new VerifiablePresentationTokenValidator(validatorOptions, this.crypto, <IExpectedVerifiablePresentation> {type: TokenType.verifiablePresentation, didAudience: this.crypto.builder.did}),
        siop: new SiopTokenValidator(validatorOptions, <IExpectedSiop> {type: TokenType.siop, audience: this._audienceUrl})
      };
    }

    return this._tokenValidators;
  }

  /**
   * Gets the resolver
   */
  public get resolver(): IDidResolver {
    return this._resolver;
  }

  /**
   * Specify the trusted issuer for the verifiable credentials
   * @param issuers array of issuers
   */
  public useTrustedIssuersForVerifiableCredentials(issuers: string[]): ValidatorBuilder {
    this._trustedIssuersForVerifiableCredentials = issuers;
    return this;
  }

  /**
   * Specify the trusted issuer for the verifiable credentials
   * @param issuers array of issuers
   */
  public get trustedIssuersForVerifiableCredentials(): string[] | undefined {
    return this._trustedIssuersForVerifiableCredentials;
  }

  /**
   * Specify the trusted issuer configuration endpoints for the OpenID Connect providers
   * @param issuers array of issuers
   */
  public useTrustedIssuerConfigurationsForIdTokens(issuers: string[]): ValidatorBuilder {
    this._trustedIssuerConfigurationsForIdTokens = issuers;
    return this;
  }

  /**
   * Specify the trusted issuer for the verifiable credentials
   * @param issuers array of issuers
   */
  public get trustedIssuerConfigurationsForIdTokens(): string[] | undefined {
    return this._trustedIssuerConfigurationsForIdTokens;
  }

  /**
   * Specify the audience url of the validator
   * @param audience url of the validator
   */
  public useAudienceUrl(audience: string): ValidatorBuilder {
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

