/**
 * Class to model your presentation exchange request
 */

import ITestModel from './ITestModel';
import RequestAttestationsOneVcSaIdtokenResponseOk from './RequestAttestationsOneVcSaIdtokenResponseOk';


export default class RequestAttestationsOneVcSaIdtokenResponseNoIdToken extends RequestAttestationsOneVcSaIdtokenResponseOk implements ITestModel {

    public preSiopResponseOperations = [
        {
        path: '$.attestations.idTokens',
        operation: () => undefined
    }];
}