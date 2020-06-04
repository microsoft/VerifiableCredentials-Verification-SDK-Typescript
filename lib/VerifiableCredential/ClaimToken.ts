/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import base64url from 'base64url';
import VerifiableCredentialConstants from './VerifiableCredentialConstants';

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
   * Token is SIOP token presentation request
   */
  siopPresentation = 'siopPresentation',

  /**
   * Token is verifiable presentation
   */
  verifiablePresentation = 'verifiablePresentation',

  /**
   * Token is verifiable credential
   */
  verifiableCredential = 'verifiableCredential'
}

/**
 * Model for the claim token in compact format
 */
export default class ClaimToken {
  private _configuration: string = '';
  private _rawToken: string = '';
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
  public get configuration(): string {
    return this._configuration;
  }

  /**
   * Gets the raw token
   */
  public get rawToken(): string {
    return this._rawToken;
  }

  /**
   * Gets the token header
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
   * @param configuration The configuration endpoint
   */
  constructor(typeName: string, token: string, configuration: string) {
    const tokentypeValues: string[] = Object.values(TokenType);
    if (tokentypeValues.includes(typeName)) {
      this._type = typeName as TokenType;
    } else if (typeName === VerifiableCredentialConstants.CLAIMS_SELFISSUED) {
      this._type = TokenType.selfIssued;
    } else if (ClaimToken.isVc(typeName)) {
      this._type = TokenType.verifiablePresentation;
    } else {
      this._type = TokenType.idToken;
    }

    if( typeof token === 'string'){
      this._rawToken = token as string;
      this.decode();
    }
    else{
      this._decodedToken = token;
    }

    this._configuration = configuration;
  }

  /**
   * Test if token name is a reference to a VC.
   * @param tokenName Name to test for VC
   */
  public static isVc(tokenName: string): boolean {
    return tokenName.includes(VerifiableCredentialConstants.CLAIMS_VERIFIABLECREDENTIAL);
  }

  /**
   * Decode the token
   * @param type Claim type
   * @param values Claim value
   */
  private decode(): void {
    const parts = this.rawToken.split('.');
    if (parts.length < 2) {
      throw new Error(`Cannot decode. Invalid input token`);
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
    // Deserialize the token
    const split = token.split('.');
    return JSON.parse(base64url.decode(split[1]));
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

  /**
   * Check the token type based on the payload
   * @param token to check for type
   */
  public static getTokenType(token: string): ClaimToken {
    // Deserialize the token
    const payload = ClaimToken.getTokenPayload(token);

    // Check type of token
    if (payload.iss === VerifiableCredentialConstants.TOKEN_SI_ISS) {
      return new ClaimToken(payload.contract ? TokenType.siopIssuance : TokenType.siopPresentation, token, '');
    }
    if (payload.vc) {
      return new ClaimToken(TokenType.verifiableCredential, token, '');
    }
    if (payload.vp) {
      return new ClaimToken(TokenType.verifiablePresentation, token, '');
    }
    // Check for signature
    if (ClaimToken.tokenSignature(token)) {
      return new ClaimToken(TokenType.idToken, token, '');
    }

    return new ClaimToken(TokenType.selfIssued, token, '');
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
        decodedTokens[VerifiableCredentialConstants.CLAIMS_SELFISSUED] = new ClaimToken(TokenType.selfIssued, token, '');
      }
      else {
        for (let tokenKey in token) {
          const claimToken = ClaimToken.getTokenType(token[tokenKey]);
          decodedTokens[tokenKey] = claimToken;
        }
      }
    };
    return decodedTokens;
  }

  /**
  * Attestations contain the tokens and VCs in the input.
  * This algorithm will convert the attestations to a ClaimToken
  * @param attestation The attestation
  */
  private static fromAttestation(attestation: string): ClaimToken {
    const token = ClaimToken.getTokenType(attestation);
    return token;
  }
}