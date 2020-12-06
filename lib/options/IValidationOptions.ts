/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import ClaimToken from '../verifiable_credential/ClaimToken';
import { IValidationResponse } from '../input_validation/IValidationResponse';
import { IPayloadProtectionSigning } from 'verifiablecredentials-crypto-sdk-typescript';
import { ValidationHelpers } from '../input_validation/ValidationHelpers';
import IValidatorOptions from './IValidatorOptions';
import { IExpectedBase, IExpectedVerifiablePresentation, IExpectedVerifiableCredential, IExpectedAudience } from './IExpected';

 export type GetTokenObject = (validationResponse: IValidationResponse, token: string | object) => Promise<IValidationResponse>;
 export type ResolveDidAndGetKeys = (validationResponse: IValidationResponse) => Promise<IValidationResponse>;
 export type ValidateDidSignature = (validationResponse: IValidationResponse, token: IPayloadProtectionSigning) => Promise<IValidationResponse>;
 export type CheckTimeValidityOnIdToken = (validationResponse: IValidationResponse, driftInSec?: number) => IValidationResponse;
 export type CheckTimeValidityOnToken = (validationResponse: IValidationResponse, driftInSec?: number) => IValidationResponse;
 export type CheckScopeValidityOnToken = (validationResponse: IValidationResponse, expected: IExpectedBase) => IValidationResponse;
 export type CheckScopeValidityOnIdToken = (validationResponse: IValidationResponse, expected: IExpectedAudience) => IValidationResponse;
 export type CheckScopeValidityOnVpToken = (validationResponse: IValidationResponse, expected: IExpectedVerifiablePresentation, siopDid: string) => IValidationResponse;
 export type CheckScopeValidityOnVcToken = (validationResponse: IValidationResponse, expected: IExpectedVerifiableCredential, siopDid: string) => IValidationResponse;
 export type FetchKeyAndValidateSignatureOnIdToken = (validationResponse: IValidationResponse, token: ClaimToken) => Promise<IValidationResponse>;
 export type ValidateSignatureOnToken = (validationResponse: IValidationResponse, token: ClaimToken, key: any) => Promise<IValidationResponse>;
 export type GetTokensFromSiop = (validationResponse: IValidationResponse) => IValidationResponse;
 export type FetchOpenIdTokenPublicKeys = (validationResponse: IValidationResponse, token: ClaimToken) => Promise<IValidationResponse | any>;

 /**
 *Interface to model validation options
 */
export interface IValidationOptions {
/**
 * The validator options
 */
validatorOptions: IValidatorOptions;

/**
 * Gets the helpers
 */
validationHelpers: ValidationHelpers;

/**
 * Get the token object from the request body
 */
getTokenObjectDelegate: GetTokenObject;

/**
  * Resolve the DID and retrieve the public keys
  */
 resolveDidAndGetKeysDelegate: ResolveDidAndGetKeys,

 /**
  * Validate DID signature
  */
 validateDidSignatureDelegate: ValidateDidSignature,

  /**
   * Check the time validity of the token
   */
  checkTimeValidityOnTokenDelegate: CheckTimeValidityOnToken,

  /**
   * Check the scope validity of the token
   */
  checkScopeValidityOnSiopTokenDelegate: CheckScopeValidityOnToken,

  /**
   * Check the scope validity of the id token
   */
  checkScopeValidityOnIdTokenDelegate: CheckScopeValidityOnIdToken,

  /**
   * Check the scope validity of the verifiable presentation token
   */
  checkScopeValidityOnVpTokenDelegate: CheckScopeValidityOnVpToken,

  /**
   * Check the scope validity of the verifiable credential token
   */
  checkScopeValidityOnVcTokenDelegate: CheckScopeValidityOnVcToken,

  /**
   * Delegate for getting a key and validate the signature on the token
   */
  fetchKeyAndValidateSignatureOnIdTokenDelegate: FetchKeyAndValidateSignatureOnIdToken,

  /**
   * Signature validation
   */
  validateSignatureOnTokenDelegate: ValidateSignatureOnToken,

  /**
   * fetch the public keys of an OpenId Provider
   */
  fetchOpenIdTokenPublicKeysDelegate: FetchOpenIdTokenPublicKeys,
}
