/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import VerifiableCredentialConstants from './VerifiableCredentialConstants';
import ValidationError from '../error_handling/ValidationError';
import { PresentationDefinitionModel } from '../index';
import ErrorHelpers from '../error_handling/ErrorHelpers';
import JsonWebSignatureToken, { TokenPayload } from './JsonWebSignatureToken';
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
   * Token is id token hint
   */
  idTokenHint = 'idTokenHint',

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
  private readonly _jsonWebToken?: JsonWebSignatureToken;

  /**
   * JsonWebSignatureToken instance 
   */
  public get jsonWebToken(): JsonWebSignatureToken | undefined {
    return this._jsonWebToken;
  }

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
  constructor(typeName: string, token: string | JsonWebSignatureToken | TokenPayload, id?: string) {
    const tokentypeValues: string[] = Object.values(TokenType);
    if (tokentypeValues.includes(typeName)) {
      this._type = typeName as TokenType;
    } else {
      throw new ValidationError(`Type '${typeName}' is not supported`, errorCode(1));
    }

    if(typeof token === 'string'){
      token = new JsonWebSignatureToken(token);
    }

    if (token instanceof JsonWebSignatureToken) {
      this._rawToken = token.token;
      this._tokenHeader = token.header;
      this._decodedToken = token.payload;
      this._jsonWebToken = token;
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
  public static create(token: string | TokenPayload, id?: string): ClaimToken {
    // the only inputs that are not a string are JSON LD or self attested claims
    if (typeof token !== 'string') {
      // check for json LD
      if (token['\@context'] && token.type && token.type.length >= 1 && token.type.includes('VerifiableCredential')) {
        return new ClaimToken(TokenType.verifiableCredential, token, id);
      }

      return new ClaimToken(TokenType.selfIssued, token, id);
    }

    // compact jwt      
    const jws = new JsonWebSignatureToken(token);
    const { payload } = jws;

    // Check type of token
    if (payload.iss === VerifiableCredentialConstants.TOKEN_SI_ISS) {
      if (id === VerifiableCredentialConstants.TOKEN_SI_ISS) {
        return new ClaimToken(TokenType.idTokenHint, jws, id);
      }

      if (payload.contract) {
        return new ClaimToken(TokenType.siopIssuance, jws, id);
      }

      if (payload.presentation_submission) {
        return new ClaimToken(TokenType.siopPresentationExchange, jws, id);
      }

      if (payload.attestations) {
        return new ClaimToken(TokenType.siopPresentationAttestation, jws, id);
      }

      return new ClaimToken(TokenType.siop, jws, id);
    }

    if (payload.vc) {
      return new ClaimToken(TokenType.verifiableCredential, jws, id);
    }
    if (payload.vp) {
      return new ClaimToken(TokenType.verifiablePresentationJwt, jws, id);
    }

    return new ClaimToken(TokenType.idToken, jws, id);
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
          const claimToken = ClaimToken.create(token[tokenKey], tokenKey);
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
}