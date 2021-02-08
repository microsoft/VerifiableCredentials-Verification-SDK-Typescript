/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import base64url from 'base64url';
import VerifiableCredentialConstants from './VerifiableCredentialConstants';
import ValidationError from '../error_handling/ValidationError';
import { PresentationDefinitionModel  } from '../index';
import ErrorHelpers from '../error_handling/ErrorHelpers';
const jp = require('jsonpath');
const errorCode = (error: number) => ErrorHelpers.errorCode('VCSDKCLTO', error);

/**
 * Enum for define the token type
 */
export enum TokenType {
  /**
   * Token is self issued
   */
  selfIssued = 'selfIssued',

  /**
   * Token is id token
   */
  idToken = 'idToken',

  /**
   * Token is SIOP token issuance request
   */
  siopIssuance = 'siopIssuance',

  /**
   * Token is SIOP token
   */
  siop = 'siop',

  /**
   * Token is SIOP token presentation request with attestation presentation protocol
   */
  siopPresentationAttestation = 'siopPresentationAttestation',

  /**
   * Token is SIOP token presentation request with presentation exchange protocol
   */
  siopPresentationExchange = 'siopPresentationExchange',

  /**
   * Token is verifiable presentation
   */
  verifiablePresentationJwt = 'verifiablePresentationJwt',

  /**
   * Token is verifiable credential
   */
  verifiableCredential = 'verifiableCredential',

  /**
   * Token is verifiable credential
   */
  verifiablePresentationStatus = 'verifiablePresentationStatus',
}

/**
 * Model for the claim token in compact format
 */
export default class ClaimToken {
  private _id: string = '';
  private _rawToken: string | object = '';
  private _type: TokenType;
  private _decodedToken: { [key: string]: any } = {};
  private _tokenHeader: { [key: string]: any } = {};

  /**
   * Token type
   */
  public get type(): TokenType {
    return this._type;
  }

  /**
   * Token configuration endpoint
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Gets the raw token
   */
  public get rawToken(): string | object {
    return this._rawToken;
  }

  /**
   * Sets the raw token
   */
  public set rawToken(value) {
    this._rawToken = value;
  }

  /**
   * Gets the token header
   */
  public get tokenHeader(): { [key: string]: any } {
    return this._tokenHeader;
  }


  /**
   * Gets the decoded token
   */
  public get decodedToken(): { [key: string]: any } {
    return this._decodedToken;
  }

  /**
   * Create a new instance of <see @ClaimToken>
   * @param typeName Name of the token in _claimNames
   * @param token The raw token
   * @param id The id of the token (configuration endpoint for id tokens)
   */
  constructor(typeName: string, token: string | object, id?: string) {
    const tokentypeValues: string[] = Object.values(TokenType);
    if (tokentypeValues.includes(typeName)) {
      this._type = typeName as TokenType;
    } else {
      throw new ValidationError(`Type '${typeName}' is not supported`, errorCode(1));
    }

    if (typeof token === 'string') {
      this._rawToken = token as string;
      this.decode();
    }
    else {
      this._rawToken = this._decodedToken = token;
    }

    this._id = id || '';
  }

  /**
   * Factory class to create a ClaimToken containing the token type, raw token and decoded payload
   * @param token to check for type
   */
  public static create(token: string | object, id?: string): ClaimToken {

    let payload: any;
    if (typeof token === 'string') {
      // Deserialize the token
      payload = ClaimToken.getTokenPayload(<string>token);
    } else {
      payload = token;
    }

    // check for json LD
    if (payload['\@context'] && payload.type && payload.type.length >= 1 && payload.type.includes('VerifiableCredential')) {
      return new ClaimToken(TokenType.verifiableCredential, payload, id);
    } else {
      // compact jwt      
      // Check type of token
      if (payload.iss === VerifiableCredentialConstants.TOKEN_SI_ISS) {
        if (payload.contract) {
          return new ClaimToken(TokenType.siopIssuance, <string>token, id);
        } else if (payload.presentation_submission) {
          return new ClaimToken(TokenType.siopPresentationExchange, <string>token, id);
        } else if (payload.attestations) {
          return new ClaimToken(TokenType.siopPresentationAttestation, <string>token, id);
        } else {
          return new ClaimToken(TokenType.siop, <string>token, id);
        }
      }

      if (payload.vc) {
        return new ClaimToken(TokenType.verifiableCredential, <string>token, id);
      }
      if (payload.vp) {
        return new ClaimToken(TokenType.verifiablePresentationJwt, <string>token, id);
      }

      // Check for signature
      if (ClaimToken.tokenSignature(<string>token)) {
        return new ClaimToken(TokenType.idToken, <string>token, id);
      }

      return new ClaimToken(TokenType.selfIssued, <string>token, id);
    }
  }

  /**
  * Attestations contain the tokens and VCs in the input.
  * This algorithm will convert the attestations to a ClaimToken
  * @param attestations All presented claims
  */
  public static getClaimTokensFromAttestations(attestations: { [key: string]: string }): { [key: string]: ClaimToken } {
    const decodedTokens: { [key: string]: ClaimToken } = {};

    for (let key in attestations) {
      const token: any = attestations[key];

      if (key === VerifiableCredentialConstants.CLAIMS_SELFISSUED) {
        decodedTokens[VerifiableCredentialConstants.CLAIMS_SELFISSUED] = new ClaimToken(TokenType.selfIssued, token);
      }
      else {
        for (let tokenKey in token) {
          const claimToken = ClaimToken.create(token[tokenKey]);
          decodedTokens[tokenKey] = claimToken;
        }
      }
    };
    return decodedTokens;
  }

  /**
  * Attestations contain the tokens and VCs in the input.
  * This algorithm will convert the attestations to a ClaimToken
  * @param payload The presentaiton exchange payload 
  */
 public static getClaimTokensFromPresentationExchange(payload: PresentationDefinitionModel): { [key: string]: ClaimToken } {
  const decodedTokens: { [key: string]: ClaimToken } = {};
    // Get descriptor map
    const descriptorMap: any[] = jp.query(payload, `$.presentation_submission.descriptor_map.*`);

    for (let inx = 0; inx < descriptorMap.length; inx++) {
      const item = descriptorMap[inx];
      if (item) {
        if (!item.id) {
          throw new ValidationError(`The SIOP presentation exchange response has descriptor_map without id property`, errorCode(2));
        } else if (item.path) {
          const tokenFinder = jp.query(payload, item.path);
          if (tokenFinder.length == 0) {
            throw new ValidationError(`The SIOP presentation exchange response has descriptor_map with id '${item.id}'. This path '${item.path}' did not return a token.`, errorCode(3));
          } else if (tokenFinder.length > 1) {
            throw new ValidationError(`The SIOP presentation exchange response has descriptor_map with id '${item.id}'. This path '${item.path}' points to multiple credentails and should only point to one credential.`, errorCode(4));
          } else if (typeof tokenFinder[0] === 'string') {
            const foundToken = tokenFinder[0];
            const claimToken = ClaimToken.create(foundToken);
            decodedTokens[item.id] = claimToken;
          } else if (tokenFinder[0]['\@context']) {
            const foundToken = tokenFinder[0];
            const claimToken = ClaimToken.create(foundToken);
            decodedTokens[item.id] = claimToken;
          }
        } else {
          throw new ValidationError(`The SIOP presentation exchange response has descriptor_map with id '${item.id}'. No path property found.`, errorCode(5));
        }
      }
    }
    return decodedTokens;
  }


  /**
   * Decode the token
   * @param type Claim type
   * @param values Claim value
   */
  private decode(): void {
    const parts = (<string>this.rawToken).split('.');
    if (parts.length < 2) {
      throw new ValidationError(`Cannot decode. Invalid input token`, errorCode(6));
    }

    this._tokenHeader = JSON.parse(base64url.decode(parts[0]));
    this._decodedToken = JSON.parse(base64url.decode(parts[1]));
  }

  /**
   * Get the token object from the self issued token
   * @param token The token to parse
   * @returns The payload object
   */
  private static getTokenPayload(token: string): any {
    try {
      // Deserialize the JWT token
      const split = token.split('.');
      return JSON.parse(base64url.decode(split[1]));
    } catch (exception) {
      // Check for json ld
    }
    return JSON.parse(token);
  }

  /**
   * Get the token object from the self issued token
   * @param token The token to parse
   * @returns The payload object
   */
  private static tokenSignature(token: string): boolean {
    // Split the token
    const split = token.split('.');
    return split[2] !== undefined && split[2].trim() !== '';
  }
}