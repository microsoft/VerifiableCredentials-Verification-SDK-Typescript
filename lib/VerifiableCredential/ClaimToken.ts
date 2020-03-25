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
      this._type = TokenType.selfIssued
    } else if (ClaimToken.isVc(typeName)) {
      this._type = TokenType.verifiablePresentation;
    } else {
      this._type = TokenType.idToken;
    }

    this._rawToken = token;
    this._configuration = configuration;
    if (this._rawToken) {
      this.decode();
    }
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
  * ClaimSources and ClaimNames contain the tokens and VCs in the input.
  * This algorithm will convert the input to a CalimToken
  * @param sourceName Index in claimSources
  * @param claimSources Collection of claimSources
  * @param claimNames Collection of claimNames
  */
  public static getClaimTokensFromClaimSources(claimSources: {[key: string]: { JWT: string }}, claimNames: { [key: string]: string }): ClaimToken[]  { 
    const decodedTokens: ClaimToken[] = [];
    let allTokensFromSource = Object.getOwnPropertyNames(claimSources);
    for (let inx = 0; inx < allTokensFromSource.length; inx++) {
      const claimToken = ClaimToken.fromClaimSource(allTokensFromSource[inx], claimSources, claimNames);
      claimToken.decode();
      decodedTokens.push(claimToken);
    };
    return decodedTokens;
  }

  /**
   * Test if token name is a reference to a VC.
   * @param tokenName Name to test for VC
   */
  public static isVc(tokenName: string): boolean {
    return tokenName.includes(VerifiableCredentialConstants.CLAIMS_VERIFIABLECREDENTIAL);
  }

  /**
  * ClaimSources and ClaimNames contain the tokens and VCs in the input.
  * This algorithm will convert the input to a CalimToken
  * @param sourceName Index in claimSources
  * @param claimSources Collection of claimSources
  * @param claimNames Collection of claimNames
  */
 private static fromClaimSource(sourceName: string, claimSources: {[key: string]: { JWT: string }}, claimNames: { [key: string]: string }): ClaimToken  { 
  const claimSource = claimSources[sourceName];

  let allNameProperties = Object.getOwnPropertyNames(claimNames);
  for (let inx = 0; inx < allNameProperties.length; inx++) {
    const nameToTest = allNameProperties[inx];
    const claimNameValue = claimNames[nameToTest];
    console.log(`sourcename ${sourceName}, name ${nameToTest} , name value ${claimNameValue}, transform ${ClaimToken.getConfigurationFromSourceName(claimNameValue)}`);
    if (claimNameValue === sourceName) {
      // Get the token type. For VCs the nameToTest has the clue. All the rest is in claimNames[nameToTest].
      if (ClaimToken.isVc(nameToTest)) {
        return new ClaimToken(TokenType.verifiablePresentation, claimSource.JWT, ClaimToken.getConfigurationFromSourceName(nameToTest));
      }

      let claimToken = new ClaimToken(claimNames[nameToTest], '', '');
      switch (claimToken.type) {
        case TokenType.selfIssued:
          return new ClaimToken(TokenType.selfIssued, claimSource.JWT, VerifiableCredentialConstants.CLAIMS_SELFISSUED);
        case TokenType.idToken:
          return new ClaimToken(TokenType.idToken, claimSource.JWT, claimNameValue);
        default:
          throw new Error(`Unexpected token type ${claimToken.type}`); 
        }  
    } 
  }
  throw new Error(`Could not create ClaimToken for ${sourceName}`); 
}

  private static getConfigurationFromSourceName(configuration: string) {
    if (!configuration.includes(VerifiableCredentialConstants.CLAIMS_VERIFIABLECREDENTIAL)) {
      return configuration;
    }
    
    const split = configuration.split(VerifiableCredentialConstants.CLAIMS_VERIFIABLECREDENTIAL);
    return split[0];
  }  
}