/**
 * Class to model your presentation exchange request
 */

import ITestModel from './ITestModel';
import RequestOneJsonLdVcResponseOk from './RequestOneJsonLdVcResponseOk';


export default class RequestOneJsonLdVcResponseWrongSiopDId extends RequestOneJsonLdVcResponseOk implements ITestModel {

  public responseOperations = [
    {
      path: '$.presentation_submission.attestations.presentations.IdentityCard.verifiableCredential.credentialSubject.id',
      operation: () => 'wrong did'
    }
  ];
}