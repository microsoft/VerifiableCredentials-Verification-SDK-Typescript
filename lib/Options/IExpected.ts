/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType } from '../index';

/**
 * Type issuer mapping
 */
export type IssuerMap =  ({ [contract: string]: string[]}) | string[];



/**
 * Expected base
 */
export interface IExpectedBase {

  /**
   * The token type
   */
  type: TokenType
}


/**
 * Expected values for SIOP
 */
export interface IExpectedSiop extends IExpectedBase {

 /**
   * Expected audience for the token type
   */
  audience?: string
}

/**
 * Expected values for verifiable presentation
 */
export interface IExpectedVerifiablePresentation extends IExpectedBase {

  /**
   * Expected audience DID for the token type
   */
  didAudience?: string
}

/**
 * Expected values for verifiable credentials
 */
export interface IExpectedVerifiableCredential extends IExpectedBase {
  /**
   * Expected issuers for the different contracts.
   */
  contractIssuers?: IssuerMap,
}

/**
 * Expected values for self issued tokens
 */
export interface IExpectedSelfIssued extends IExpectedBase {
}

export interface IExpectedAudience {

  /**
   * Expected audience for the token type
   */
  audience?: string
}


/**
 * Expected values for id tokens
 */
export interface IExpectedIdToken extends IExpectedBase, IExpectedAudience {
  /**
   * Expected issuers configuration endpoint for the different contracts.
   */
  configuration: IssuerMap,
}

/**
 * Expected values for any open id token
 */
export interface IExpectedOpenIdToken extends IExpectedBase, IExpectedAudience {
  /**
   * Expected issuers configuration endpoint
   */
  configuration: string,
}
