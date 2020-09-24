/**
 * Class to model your SIOP request
 */

import ITestModel from './ITestModel';
import { ClaimToken } from '../../lib';


export default class RequestAttestationsNameTagOk implements ITestModel {
    public clientId = 'https://requestor.example.com';

    /**
     * Define the model for the request
     */
    public request: any = {
        clientId: this.clientId,
        clientName: 'My relying party',
        clientPurpose: 'Need your VC to provide access',
        redirectUri: this.clientId,
        tosUri: 'https://tosUri.example.com',
        logoUri: 'https://logoUri.example.com',
        attestations: {
            selfIssued: {
                mapping: {
                    alias: {
                        claim: 'name',
                        type: 'string',
                        required: false,
                        indexed: false
                    }
                }
            }
        },
    }


    /**
     * Define the model for the response
     */
    public response: any = {
        iss: 'https://self-issued.me',
        aud: this.clientId,
        nonce: '',
        state: '',
        did: '',
        jti: 'fa8fdc8f-d95b-4237-9c90-9696112f4e19',
        attestations: {
            selfIssued: {
                name: 'Jules Winnfield',
                birthDate: '1948-21-21T00:00:00'
            },
        },
    }

    public responseStatus = {
    };

    /**
     * Return a specific VC
     * @param key Name for the vc
     */
    public getVcFromResponse(_key: string): ClaimToken | undefined {
        return undefined;
    }

    /**
     * Return all presentations from model
     */
    public getPresentationsFromModel(): { [key: string]: any } | undefined {
        return undefined;
    }

    /**
     * Return all non presented VCs
     */
    public getNonPresentedVcFromModel(): { [key: string]: any } {
        return {};
    }
    
    /**
     * Return all id tokens from model
     */
    public getIdTokensFromModel(): { [key: string]: any }  {
        return {};
    }
}