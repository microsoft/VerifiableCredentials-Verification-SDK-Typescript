/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType } from '../index';

/**
 * Type for delegates to validate certain value in the token
 */
export type CheckTokenProperty = (property: any) => boolean;


/**
 * Expected values for SIOP
 */
export interface IExpectedSiop {

  /**
   * The token type
   */
  type: TokenType,

  /**
   * Expected audience for the token type
   */
  audience?: string , 
}

/**
 * Expected values for verifiable presentation
 */
export interface IExpectedVerifiablePresentation {

  /**
   * The token type
   */
  type: TokenType,


  /**
   * Expected audience DID for the token type
   */
  didAdience?: string , 
}

/**
 * Expected values for verifiable credentials
 */
export interface IExpectedVerifiableCredential {

  /**
   * The token type
   */
  type: TokenType,

  /**
   * Expected issuers for the token type (iss). 
   * Configuration url for id tokens. The actual issuer is found in the issuer property of the configuration data.
   */
  issuers?: string[],

  /**
   * Expected audience for the token type
   */
  audience?: string , 

  /**
   * Verifiable credentials will use contracts to define their type
   */
  contracts?: string[],
}

/**
 * Expected values for self issued tokens
 */
export interface IExpectedSelfIssued {

  /**
   * The token type
   */
  type: TokenType,

  /**
   * Expected issuers for the token type (iss). 
   * Configuration url for id tokens. The actual issuer is found in the issuer property of the configuration data.
   */
  issuers?: string[],

  /**
   * Expected audience for the token type
   */
  audience?: string , 

  /**
   * Verifiable credentials will use contracts to define their type
   */
  contracts?: string[],
}

/**
 * Expected values for id tokens
 */
export interface IExpectedIdToken {

  /**
   * The token type
   */
  type: TokenType,

  /**
   * Configuration url for id tokens. The actual issuer is found in the issuer property of the configuration data.
   */
  configuration: string[],

  /**
   * Expected audience for the token type
   */
  audience?: string
}

export default interface IExpected {
  /**
   * The DID of the validator
   */
  did?: string,

  /**
   * The token type
   */
  type: TokenType,

  /**
   * Expected issuers for the token type (iss). 
   * Configuration url for id tokens. The actual issuer is found in the issuer property of the configuration data.
   */
  issuers?: string[],

  /**
   * Expected audience for the token type
   */
  audience?: string ,

  /**
   * Expected subject for the token type
   */
  subject?: string ,

  /**
   * Verifiable credentials will use contracts to define their type
   */
  contracts?: string[],
  
}