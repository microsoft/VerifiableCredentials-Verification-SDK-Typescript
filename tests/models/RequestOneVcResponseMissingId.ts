/**
 * Class to model your presentation exchange request
 */

import ITestModel from './ITestModel';
import RequestOneVcResponseOk from './RequestOneVcResponseOk';


export default class RequestOneVcResponseMissingId extends RequestOneVcResponseOk implements ITestModel {

  public responseOperations = [
    {
      path: '$.presentation_submission.descriptor_map[0].id',
      operation: () => undefined
    }];

}