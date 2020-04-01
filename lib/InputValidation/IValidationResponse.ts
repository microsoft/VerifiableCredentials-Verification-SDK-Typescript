/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ICryptoToken } from '@microsoft/crypto-sdk';
import { DidDocument } from '@decentralized-identity/did-common-typescript';
import ClaimToken from '../VerifiableCredential/ClaimToken';
import IValidationResult from '../Api/ValidationResult';


//#endregion

export interface IValidationResponse {
  /**
   * True if validation passed
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
   * Additional error object
   */
  innerError?: any;

  /**
   * The signed token
   */
  didSignature?: ICryptoToken;

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
  tokensToValidate?: string[];

  /**
   * All claims found in input tokens
   */
  validationResult?: IValidationResult;
}
