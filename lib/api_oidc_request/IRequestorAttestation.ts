import { IssuanceAttestationsModel, IRequestor } from '../index';

/**
 * Interface to initialize the Requestor
 */
export default interface IRequestorAttestation extends IRequestor {
  /**
   * claims being asked for
   */
  attestation: IssuanceAttestationsModel
}