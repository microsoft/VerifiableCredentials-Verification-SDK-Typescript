import { Requestor, IssuanceAttestationsModel, Crypto } from '../index';

/**
 * Interface to initialize the Requestor
 */
export default interface IRequestor {

  /**
   * the crypto object
   */
  crypto: Crypto,

  /**
   * the name of the requestor (Relying Party)
   */
  clientName: string,

  /**
   * explaining the purpose of sending claims to relying party
   */
  clientPurpose: string,

  /**
   *  the url where the request came from
   */
  clientId: string,

  /**
   *  url to send response to
   */
  redirectUri: string,

  /**
   * url pointing to terms and service user can open in a webview
   */
  tosUri: string,

  /**
   * url pointing to logo of the requestor (Relying Party)
   */
  logoUri: string,

  /**
   * claims being asked for
   */
  attestation: IssuanceAttestationsModel
}