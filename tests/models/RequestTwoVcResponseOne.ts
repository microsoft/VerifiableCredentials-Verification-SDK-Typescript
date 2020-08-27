/**
 * Class to model your presentation exchange request
 */

import { ClaimToken, TokenType } from '../../lib';
import RequestTwoVcResponseOk from './RequestTwoVcResponseOk';
import ITestModel from './ITestModel';


export default class RequestTwoVcResponseOne extends RequestTwoVcResponseOk implements ITestModel {

    public responseOperations = [
        {
        path: '$.presentation_submission.attestations.presentations.Diploma',
        operation: () => undefined
    },
    {
        path: '$.presentation_submission.descriptor_map[1]',
        operation: () => undefined
    }];
}