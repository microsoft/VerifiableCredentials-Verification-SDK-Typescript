/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { FetchKeyAndValidateSignatureOnIdToken, IValidationOptions, CheckTimeValidityOnToken, ResolveDidAndGetKeys, GetTokenObject, ValidateDidSignature, CheckScopeValidityOnToken, ValidateSignatureOnToken, GetTokensFromSiop, CheckScopeValidityOnVcToken, CheckScopeValidityOnIdToken, CheckScopeValidityOnVpToken } from './IValidationOptions';
import { ValidationHelpers } from '../InputValidation/ValidationHelpers';
import IValidatorOptions from './IValidatorOptions';
import { TokenType } from '../index';

/**
 *Interface to model validation options
 */
export default class ValidationOptions implements IValidationOptions {

/**
 * Create new instance of <see @class ValidationOptions>
 * @param validatorOptions The validator options
 * @param tokenType The type of token to validate
 */
constructor (public validatorOptions: IValidatorOptions, public tokenType: TokenType) {
  this.validationHelpers = new ValidationHelpers(validatorOptions, this, tokenType);
  this.getTokenObjectDelegate = this.validationHelpers.getTokenObject;
    
  this.resolveDidAndGetKeysDelegate = this.validationHelpers.resolveDidAndGetKeys;
  this.validateDidSignatureDelegate = this.validationHelpers.validateDidSignature;
  this.checkTimeValidityOnTokenDelegate = this.validationHelpers.checkTimeValidityOnToken;
  this.checkScopeValidityOnSiopTokenDelegate = this.validationHelpers.checkScopeValidityOnSiopToken;
  this.checkScopeValidityOnIdTokenDelegate = this.validationHelpers.checkScopeValidityOnIdToken;
  this.checkScopeValidityOnVpTokenDelegate = this.validationHelpers.checkScopeValidityOnVpToken;
  this.checkScopeValidityOnVcTokenDelegate = this.validationHelpers.checkScopeValidityOnVcToken;
  this.fetchKeyAndValidateSignatureOnIdTokenDelegate = this.validationHelpers.fetchKeyAndValidateSignatureOnIdToken;
  this.validateSignatureOnTokenDelegate = this.validationHelpers.validateSignatureOnToken;
  this.getTokensFromSiopDelegate = this.validationHelpers.getTokensFromSiop;
}

/**
 * Gets the helpers
 */
public validationHelpers: ValidationHelpers;

/**
 * Get the token object from the request body
 */
public getTokenObjectDelegate: GetTokenObject;

/**
  * Resolve the DID and get public keys
  */
 public resolveDidAndGetKeysDelegate: ResolveDidAndGetKeys; 

 /**
  * Validate the DID signatyre
  */
 public validateDidSignatureDelegate: ValidateDidSignature;

  /**
   * Check the time validity of the token
   */
  public checkTimeValidityOnTokenDelegate: CheckTimeValidityOnToken;

  /**
   * Check the scope validity of the token
   */
  public checkScopeValidityOnSiopTokenDelegate: CheckScopeValidityOnToken;

  /**
   * Check the scope validity of the token
   */
  public checkScopeValidityOnIdTokenDelegate: CheckScopeValidityOnIdToken;

  /**
   * Check the scope validity of the verifiable presentation token
   */
  public checkScopeValidityOnVpTokenDelegate: CheckScopeValidityOnVpToken;

  /**
   * Check the scope validity of the verifiable credential token
   */
  public checkScopeValidityOnVcTokenDelegate: CheckScopeValidityOnVcToken;

  /**
   * Delegate for getting a key and validate the signature on the token
   */
  public fetchKeyAndValidateSignatureOnIdTokenDelegate: FetchKeyAndValidateSignatureOnIdToken;
  
  /**
   * Signature validation
   */
  public validateSignatureOnTokenDelegate: ValidateSignatureOnToken;
  
  /**
   * Retrieve tokens from SIOP
   */
  public getTokensFromSiopDelegate: GetTokensFromSiop;
}
