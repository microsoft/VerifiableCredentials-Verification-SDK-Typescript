export default interface IValidationResult {
/**
 * Gets the DID of the requestor
 */
  did: string,

  /**
   * Gets the contract of the requestor
   */
  contract: string,

  /**
   * Claims found in the input verifiable credentials
   */
  verifiableCredentials?: { [type: string]: any },

  /**
   * Claims found in the input verifiable presentations
   */
  verifiablePresentations?:  { [type: string]: any },

  /**
   * Claims found in the input id tokens
   */
  idTokens?: { [id: string]: any },

  /**
   * Claims found in the input self issued token
   */
  selfIssued?: any

  /**
   * Claims found in the input SIOP
   */
  siop?: any

  /**
   * The jti of the incoming siop token
   */
  siopJti: string,
}