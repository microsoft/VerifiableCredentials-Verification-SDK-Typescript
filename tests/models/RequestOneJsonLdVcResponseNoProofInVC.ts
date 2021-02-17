/**
 * Class to model your presentation exchange request
 */

import ITestModel from "./ITestModel";
import RequestOneJsonLdVcResponseOk from "./RequestOneJsonLdVcResponseOk";


export default class RequestOneJsonLdVcResponseNoProofInVC extends RequestOneJsonLdVcResponseOk implements ITestModel {
  public preSiopResponseOperations = [
    {
      path: '$.presentation_submission.attestations.presentations.IdentityCard.verifiableCredential.proof',
      operation: () => undefined
    }];
}