/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import base64url from 'base64url';
import ErrorHelpers from '../error_handling/ErrorHelpers';
import ValidationError from '../error_handling/ValidationError';
const errorCode = (error: number) => ErrorHelpers.errorCode('VCSDKJWTO', error);

/**
 * Type that describes an object that maps a key to a value.
 */
export type TokenPayload = { [claim: string]: any };

/**
 * class for parsing unecrypted Json Web Tokens
 */
export default class JsonWebSignatureToken {
  /**
   * The expected number of parts for a JWS compact token
   */
  private static readonly EXPECTED_PARTS: number = 3;

  /**
   * Encoding of the header as mandated per JWS rfc: https://tools.ietf.org/html/rfc7515#section-2
   */
  private static readonly UTF8_ENCODING = 'utf8';

  /**
   * flag indicating whether or not the token is an unsecured jws
   */
  public readonly unsecured: boolean;

  /**
   * Decoded header of the token
   */
  public readonly header: TokenPayload;

  /**
   * decoded payload of the token
   */
  public readonly payload: TokenPayload;

  /**
   * encoded signature of the token
   */
  public readonly signature: string;

  /**
   * the length of the pre-image of the token
   * per RFC7515: https://tools.ietf.org/html/rfc7515#section-3.3
   */
  private readonly preimageLength: number;

  /**
   * Create a parsed JsonWebSignatureToken per https://tools.ietf.org/html/rfc7515#section-7.1
   * @param token jws compact token string
   */
  constructor(public readonly token: string) {
    const parts = token.split('.');

    // a signed jws is header.payload.signature per https://tools.ietf.org/html/rfc7515#section-7.1
    // a unsecured jws is header.payload. per https://tools.ietf.org/html/rfc7515#appendix-A.5
    if (parts.length < JsonWebSignatureToken.EXPECTED_PARTS) {
      throw new ValidationError('Invalid json web token', errorCode(1));
    }

    this.header = JsonWebSignatureToken.parsePayload(parts[0], 'header', 2);
    this.payload = JsonWebSignatureToken.parsePayload(parts[1], 'payload', 3);
    this.signature = parts[2];
    this.unsecured = !parts[2];

    // the preimage does not include a the trailing seperator
    this.preimageLength = 1 + parts[0].length + parts[1].length;
  }

  /**
   * Encode a protected header and payload into a unsecured compact jws
   * @param header TokenPayload instance
   * @param payload TokenPayload instance
   * @returns JsonWebSignatureToken instance
   */
  public static encode(header: TokenPayload, payload: TokenPayload): JsonWebSignatureToken {
    const encodedHeader = base64url.encode(JSON.stringify(header), JsonWebSignatureToken.UTF8_ENCODING);
    const encodedPayload = base64url.encode(JSON.stringify(payload), JsonWebSignatureToken.UTF8_ENCODING);
    return new JsonWebSignatureToken(`${encodedHeader}.${encodedPayload}.`);
  }

  /**
   * parse a payload
   * @param encodedPart encoded string
   * @param name name of the part
   * @param scenario scenario id
   * @returns TokenPayload instance
   */
  private static parsePayload(encodedPart: string, name: string, scenario: number): TokenPayload {
    try {
      return JSON.parse(base64url.decode(encodedPart));
    } catch (error) {
      throw new ValidationError(`Invalid json web token the ${name} is malformed`, errorCode(scenario));
    }
  }
}