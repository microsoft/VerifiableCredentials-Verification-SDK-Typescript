/**
 * Class to model your presentation exchange request
 */

import { ClaimToken, TokenType } from '../../lib';
import RequestTwoVcResponseOk from './RequestTwoVcResponseOk';
import ITestModel from './ITestModel';


export default class RequestTwoVcResponseRevoked extends RequestTwoVcResponseOk implements ITestModel {

  
    public responseStatus = {
        'IdentityCard': {
            'credentialStatus': {
                'status': 'revoked',
                'reason': `stolen`
            }
        },
        'Diploma': {
            'credentialStatus': {
                'status': 'valid',
                'reason': `Accredited`
            }
        }
    };
}