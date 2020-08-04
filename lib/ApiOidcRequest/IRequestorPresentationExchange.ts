import { IRequestor, PresentationDefinitionModel } from '../index';

/**
 * Interface to initialize the Requestor
 */
export default interface IRequestorPresentationExchange extends IRequestor {
  /**
   * definition of the claims being asked for
   */
  presentationDefinition: PresentationDefinitionModel
}