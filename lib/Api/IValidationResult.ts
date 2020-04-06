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
  verifiableCredentials?: any[],

  /**
   * Claims found in the input id tokens
   */
  idTokens?: any[],

  /**
   * Claims found in the input self issued token
   */
  selfIssued?: any
}