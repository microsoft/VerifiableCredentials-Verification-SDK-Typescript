/**
 * Class to model your presentation exchange request
 */

import ITestModel from "./ITestModel";
import RequestTwoVcResponseOk from "./RequestTwoVcResponseOk";


export default class RequestTwoVcPointerToMultipleTokens extends RequestTwoVcResponseOk implements ITestModel {
  public preSiopResponseOperations = [
    {
      path: '$.presentation_submission.descriptor_map[0].path',
      operation: () => '$.presentation_submission.attestations.presentations.*'
    }];
}