/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Class for verifyable credentials constants
 */
export default class VerifiableCredentialConstants {
  /**
   * Constant for claims
   */
  public static ATTESTATIONS = 'attestations';

  /**
   * Constant for presentation exchange claims
   */
  public static PRESENTATION_SUBMISSION = 'presentation_submission';

  /**
   * Constant for status request receipts
   */
  public static RECEIPT = 'receipt';

  /**
   * Constant for  context
   */
  public static CLAIM_CONTEXT = '@context';

  /**
   * Constant for default context
   */
  public static DEFAULT_VERIFIABLECREDENTIAL_CONTEXT = 'https://www.w3.org/2018/credentials/v1';

  /**
   * Constant for default type
   */
  public static DEFAULT_VERIFIABLECREDENTIAL_TYPE = 'VerifiableCredential';

  /**
   * Constant for default type
   */
  public static DEFAULT_VERIFIABLEPRESENTATION_TYPE = 'VerifiablePresentation';
  
  /**
   * Constant for self issued claims
   */
  public static CLAIMS_SELFISSUED = 'selfIssued';

  /**
   * Constant for id tokens claims
   */
  public static CLAIMS_IDTOKENS = 'idTokens';
  
  /**
   * Constant found in names of verifiable credentials
   */
  public static CLAIMS_VERIFIABLECREDENTIAL = '#vc.';

  /**
   * Constant found in names of verifiable credentials
   */
  public static CLAIMS_VERIFIABLECREDENTIAL_IN_SOURCES = 'vp';

  /**
   * Constant for id tokens claims
   */
  public static VC_JTI_PREFIX = 'urn:pic:';
  
  /**
   * Constant for id tokens claims
   */
  public static CONFIG_JWKS = 'jwks_uri';

  /**
   * Constant for kid claim
   */
  public static TOKEN_KID = 'kid';

  /**
   * Constant for self issued issuer
   */
  public static TOKEN_SI_ISS = 'https://self-issued.me';

  /**
   * Default resolver url
   */
  public static UNIVERSAL_RESOLVER_URL = 'https://beta.discover.did.msidentity.com/1.0/identifiers/';
}