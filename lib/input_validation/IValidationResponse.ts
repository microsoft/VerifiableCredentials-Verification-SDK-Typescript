/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IPayloadProtectionSigning } from 'verifiablecredentials-crypto-sdk-typescript';
import { DidDocument } from '@decentralized-identity/did-common-typescript';
import { IValidationResult, ClaimToken } from '../index';

/**
 * The response interface
 */
export interface IResponse {
  /**
   * True if passed
   */
  result: boolean;

  /**
   * Http status
   */
  status: number;

  /**
   * Output if false. Detailed error message that can be passed in the response
   */
  detailedError?: string;

  /**
   * Output if false. Unique code for the response
   */
  code?: string;

  /**
   * Additional error object
   */
  innerError?: any;
}

export interface IValidationResponse extends IResponse {
  /**
   * The signed token
   */
  didSignature?: IPayloadProtectionSigning;

  /**
   * The payload object
   */
  payloadObject?: any;

  /**
   * The DID
   */
  did?: string;

  /**
   * The DID kid
   */
  didKid?: string;

  /**
   * The request DID
   */
  didDocument?: DidDocument;

  /**
   * The DID signing public key
   */
  didSigningPublicKey?: any;

  /**
   * List of tokens that still need to be validated
   */
  tokensToValidate?: { [key: string]: ClaimToken };

  /**
   * All claims found in input tokens
   */
  validationResult?: IValidationResult;

  /**
   * the Json Web Token Id of the incoming token
   */
  tokenId?: string;

  /**
   * The used payload protection protocol
   */
  payloadProtectionProtocol?: string;

  /**
   * The issuer of the token
   */
  issuer?: string;

  /**
   * The epoch expiration time
   */
  expiration?: number;

  /**
   * Error for the WWW-Authenticate header error field
   */
  wwwAuthenticateError?: string;
}
