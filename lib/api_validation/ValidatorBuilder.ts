/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ITokenValidator, Validator, IDidResolver, ManagedHttpResolver, VerifiablePresentationTokenValidator, VerifiableCredentialTokenValidator, IdTokenTokenValidator, SiopTokenValidator, SelfIssuedTokenValidator, TokenType, IValidatorOptions, IRequestor, Requestor, ValidationSafeguards } from '../index';
import VerifiableCredentialConstants from '../verifiable_credential/VerifiableCredentialConstants';
import { Crypto } from '../index';
import { IExpectedIdToken, IExpectedSelfIssued, IExpectedVerifiableCredential, IExpectedVerifiablePresentation, IExpectedSiop, IssuerMap } from '../options/IExpected';
import FetchRequest from '../tracing/FetchRequest';
import IFetchRequest from '../tracing/IFetchRequest';

/**
 * Class to build a token validator
 */
export default class ValidatorBuilder {
  private _tokenValidators: ({ [type: string]: ITokenValidator }) | undefined;
  
  private _trustedIssuersForVerifiableCredentials:  {[credentialType: string]: string[]} | undefined;
  private _trustedIssuerConfigurationsForIdTokens: IssuerMap | undefined;
  private _audienceUrl: string | undefined;
  private _requestor: Requestor | undefined;
  private _state: string | undefined;
  private _nonce: string | undefined;
  private _fetchRequest: IFetchRequest = new FetchRequest();
  private _resolver: IDidResolver = new ManagedHttpResolver(VerifiableCredentialConstants.UNIVERSAL_RESOLVER_URL, this._fetchRequest);
  private _validationSafeguards: ValidationSafeguards = new ValidationSafeguards();

  /**
   * Create a new instance of ValidatorBuilder
   * @param _crypto The crypto object
   */
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
   * Gets the validation options
   */
  public get validationOptions(): IValidatorOptions {
    return {
      resolver: this.resolver,
      fetchRequest: this.fetchRequest,
      validationSafeguards: this._validationSafeguards,
      crypto: this.crypto
    };
  }

 /**
   * Sets the state
   * @param state The state for the response
   * @returns The validator builder
   */
  public useState(state: string): ValidatorBuilder {
    this._state = state;
    return this;
  }

  /**
   * Get the state for the response
   */
  public get state() {
    return this._state;
  }

  /**
    * Sets the nonce
    * @param nonce The nonce for the response
    * @returns The validator builder
    */
   public useNonce(nonce: string): ValidatorBuilder {
    this._nonce = nonce;
    return this;
  }

  /**
   * Get the nonce for the response
   */
  public get nonce() {
    return this._nonce;
  }

  /**
   * Feed the request definition to automatically define the validation rules
   * @param requestor The request definition
   */
  public useRequestor(requestor: Requestor): ValidatorBuilder {
    this._requestor = requestor;
    this._audienceUrl = requestor.audienceUrl();
    this._trustedIssuersForVerifiableCredentials = requestor.trustedIssuersForVerifiableCredentials();

    if (!this._state && requestor.builder.state) {
      this._state = requestor.builder.state;
    }

    if (!this._nonce && requestor.builder.nonce) {
      this._nonce = requestor.builder.nonce;
    }
    
    return this;
  }

  /**
   * Gets the requestor
   */
  public get requestor() {
    return this._requestor;
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
      const validatorOptions: IValidatorOptions = this.validationOptions;

      this._tokenValidators = {
        selfIssued: new SelfIssuedTokenValidator(validatorOptions, <IExpectedSelfIssued> {type: TokenType.selfIssued}),
        idToken: new IdTokenTokenValidator(validatorOptions, <IExpectedIdToken> {type: TokenType.idToken, configuration: this._trustedIssuerConfigurationsForIdTokens}),
        verifiableCredential: new VerifiableCredentialTokenValidator(validatorOptions, <IExpectedVerifiableCredential> {type: TokenType.verifiableCredential, contractIssuers: this._trustedIssuersForVerifiableCredentials}),
        verifiablePresentationJwt: new VerifiablePresentationTokenValidator(validatorOptions, <IExpectedVerifiablePresentation> {type: TokenType.verifiablePresentationJwt, didAudience: this.crypto.builder.did}),
        siopPresentationAttestation: new SiopTokenValidator(validatorOptions, <IExpectedSiop> {type: TokenType.siopPresentationAttestation, audience: this._audienceUrl}),
        siop: new SiopTokenValidator(validatorOptions, <IExpectedSiop> {type: TokenType.siop, audience: this._audienceUrl}),
        siopPresentationExchange: new SiopTokenValidator(validatorOptions, <IExpectedSiop> {type: TokenType.siopPresentationExchange, audience: this._audienceUrl}),
        siopIssuance: new SiopTokenValidator(validatorOptions, <IExpectedSiop> {type: TokenType.siopIssuance, audience: this._audienceUrl})
      };
    }

    return this._tokenValidators;
  }


  /**
   * Specify the fetch client for the validator
   * @param fetchRequest New fetch client
   */
  public useFetchRequest(fetchRequest: IFetchRequest): ValidatorBuilder {
    (<any>this.resolver).fetchRequest = this._fetchRequest = fetchRequest;
     
    return this;
  }

  /**
   * Gets the fetch client
   */
  public get fetchRequest(): IFetchRequest {
    return this._fetchRequest;
  }

  /**
   * Specify the resolver of the validator
   * @param resolver New resolver
   */
  public useResolver(resolver: IDidResolver): ValidatorBuilder {
    this._resolver = resolver;
    return this;
  }

  /**
   * Gets the resolver
   */
  public get resolver(): IDidResolver {
    return this._resolver;
  }

  /**
   * Specify the trusted issuer for the verifiable credentialsrush rebuild
   * 
   * @param issuers array of issuers
   */
  public useTrustedIssuersForVerifiableCredentials(issuers: {[credentialType: string]: string[]}): ValidatorBuilder {
    this._trustedIssuersForVerifiableCredentials = issuers;
    if (this._tokenValidators) {
      // Make sure existing expected gets updated
      const vcValidator = this._tokenValidators[TokenType.verifiableCredential];
      if (vcValidator) {
        const expected: IExpectedVerifiableCredential = {type: TokenType.verifiableCredential, contractIssuers: issuers};
        this._tokenValidators[TokenType.verifiableCredential] = new VerifiableCredentialTokenValidator(this.validationOptions, expected);
      }
    }
    return this;
  }

  /**
   * Specify the trusted issuer for the verifiable credentials
   * @param issuers array of issuers or dictionary mapped to credential type
   */
  public get trustedIssuersForVerifiableCredentials():  {[credentialType: string]: string[]} | undefined {
    return this._trustedIssuersForVerifiableCredentials;
  }

  /**
   * Specify the trusted issuer configuration endpoints for the OpenID Connect providers
   * @param issuers array of issuers
   */
  public useTrustedIssuerConfigurationsForIdTokens(issuers: IssuerMap): ValidatorBuilder {
    this._trustedIssuerConfigurationsForIdTokens = issuers;
    if (this._tokenValidators) {
      // Make sure existing expected gets updated
      const idtokenValidator = this._tokenValidators[TokenType.idToken];
      if (idtokenValidator) {
        const expected: IExpectedIdToken = {type: TokenType.idToken, configuration: issuers};
        this._tokenValidators[TokenType.idToken] = new IdTokenTokenValidator(this.validationOptions, expected);
      }
    }
    return this;
  }

  /**
   * Specify the trusted issuer for the verifiable credentials
   * @param issuers array of issuers
   */
  public get trustedIssuerConfigurationsForIdTokens(): IssuerMap | undefined {
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

  /**
   * Gets the maximum number of VP tokens in a SIOP
   */
  public get maxNumberOfVCTokensInPresentation() {
    return this._validationSafeguards.maxNumberOfVCTokensInPresentation;
  }

  /**
   * Sets the maximum number of VP tokens in a SIOP
   */
  public useMaxNumberOfVCTokensInPresentation(value: number): ValidatorBuilder {
    this._validationSafeguards.maxNumberOfVCTokensInPresentation = value;
    return this;
  }

  /**
   * Gets the maximum number of VP tokens in a SIOP
   */
  public get maxSizeOfVPTokensInSiop() {
    return this._validationSafeguards.maxSizeOfVPTokensInSiop;
  }

  /**
   * Sets the maximum number of VP tokens in a SIOP
   */
  public useMaxSizeOfVPTokensInSiop(value: number): ValidatorBuilder {
    this._validationSafeguards.maxSizeOfVPTokensInSiop = value;
    return this;
  }

  /**
   * Gets the maximum number of VP tokens in a SIOP
   */
  public get maxSizeOfVCTokensInPresentation() {
    return this._validationSafeguards.maxSizeOfVCTokensInPresentation;
  }

  /**
   * Sets the maximum number of VP tokens in a SIOP
   */
  public useMaxSizeOfVCTokensInPresentation(value: number): ValidatorBuilder {
    this._validationSafeguards.maxSizeOfVCTokensInPresentation = value;
    return this;
  }

  /**
   * Gets the maximum number of VP tokens in a SIOP
   */
  public get maxSizeOfIdToken() {
    return this._validationSafeguards.maxSizeOfIdToken;
  }

  /**
   * Sets the maximum number of VP tokens in a SIOP
   */
  public useMaxSizeOfIdToken(value: number): ValidatorBuilder {
    this._validationSafeguards.maxSizeOfIdToken = value;
    return this;
  }

  // Feature flags. Used temporary to introduce a new feature
  private _enableVerifiedCredentialsStatusCheck = true;
  public get featureVerifiedCredentialsStatusCheckEnabled(): boolean {
    return this._enableVerifiedCredentialsStatusCheck;
  }

  public enableFeatureVerifiedCredentialsStatusCheck(enable: boolean): ValidatorBuilder {
    this._enableVerifiedCredentialsStatusCheck = enable;
    return this;
  }
}

