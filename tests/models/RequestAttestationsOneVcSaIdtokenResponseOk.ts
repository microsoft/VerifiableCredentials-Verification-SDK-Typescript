/**
 * Class to model your SIOP request
 */

import ITestModel from './ITestModel';
import { ClaimToken } from '../../lib';


export default class RequestAttestationsOneVcSaIdtokenResponseOk implements ITestModel {
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
            },
            presentations: [
                {
                    mapping: {
                        givenName: {
                            claim: 'vc.credentialSubject.givenName',
                            required: false,
                            indexed: false
                        },
                        familyName: {
                            claim: 'vc.credentialSubject.familyName',
                            type: 'string',
                            required: true,
                            indexed: false
                        }
                    },
                    schema: 'test schema',
                    issuers: [
                        {
                            iss: 'trusted issuer 1'
                        },
                        {
                            iss: 'trusted issuer 2'
                        }
                    ],
                    endorsers: [
                        {
                            iss: 'endorser'
                        }
                    ]
                }
            ],
            idTokens: [
                {
                    mapping: {
                        email: {
                            claim: 'upn',
                            type: 'string',
                            required: false,
                            indexed: true
                        },
                        name: {
                            claim: 'name',
                            required: false,
                            indexed: false
                        }
                    },
                    configuration: 'oidc config endpoint'
                }
            ]
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
            /*
            selfIssued: {
                name: 'Jules Winnfield',
                birthDate: '1948-21-21T00:00:00'
            },
            */
            presentations: {
                DriversLicenseCredential: {
                    'jti': `urn:pic:IdentityCard`,
                    vc: {
                        '\@context': [
                            'https://www.w3.org/2018/credentials/v1',
                            'https://pics-linux.azurewebsites.net/test/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/vc'
                        ],
                        type: [
                            'VerifiableCredential',
                            'DriversLicenseCredential'
                        ],
                        credentialSubject: {
                            birthdate: '1948-21-21T00:00:00',
                            name: 'Jules Winnfield',
                            organDonor: true,
                            id: 'JW123456'
                        },
                        credentialStatus: {
                            id: 'https://pics-linux.azurewebsites.net/test/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/vc/status',
                            type: 'CredentialStatusResponseTest'
                        }
                    },
                },
                InsuranceCredential: {
                    jti: 'urn:pic:HU1DykCGpn5zo6wgs2RK5HoVheT31wVVoR6bKLzjwD4',
                    vc: {
                        '\@context': [
                            'https://www.w3.org/2018/credentials/v1',
                            'https://pics-linux.azurewebsites.net/test/FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF/vc'
                        ],
                        type: [
                            'VerifiableCredential',
                            'InsuranceCredential'
                        ],
                        credentialSubject: {
                            model: 'The Homer',
                            name: 'Joey Jojo Junior Shabadoo',
                            make: 'Powell Motors',
                            VIN: '123456789'
                        },
                        credentialStatus: {
                            id: 'https://pics-linux.azurewebsites.net/test/FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF/vc/status',
                            type: 'CredentialStatusResponseTest'
                        }
                    },
                    iss: 'did:ion:test:EiCS5Qmia9Pm8yurO1K2qIBppqw02NSzcaMO3WO4u6ZIzA',
                    aud: 'did:ion:test:EiCAvQuaAu5awq_e_hXyJImdQ5-xJsZzzQvvd9a2EAphtQ',
                }
            },
            idTokens: {
                'https://pics-linux.azurewebsites.net/test/oidc/openid-configuration': {
                    firstName: 'Jules',
                    middleName: 'Paul',
                    lastName: 'Winnfield',
                    email: 'jules@pulpfiction.com',
                    role: 'hitman',
                    telephone: '4258058247',
                    iss: 'https://pics-linux.azurewebsites.net'
                }
            }
        },
    }

    public responseStatus = {
        'DriversLicenseCredential': {
            'credentialStatus': {
                'status': 'valid',
                'reason': `Totally checked`
            }
        },
        'InsuranceCredential': {
            'credentialStatus': {
                'status': 'valid',
                'reason': `Accredited`
            }
        }
    };

    /**
     * Return a specific VC
     * @param key Name for the vc
     */
    public getVcFromResponse(key: string): ClaimToken {
        // Decode de presentation
        let claimToken = ClaimToken.create(this.response.attestations.presentations[key]);

        claimToken = ClaimToken.create(claimToken.decodedToken.vp.verifiableCredential[0]);
        return claimToken;
    }

    /**
     * Return all presentations from model
     */
    public getPresentationsFromModel(): { [key: string]: any } {
        return this.response.attestations.presentations;
    }

    /**
     * Return all id tokens from model
     */
    public getIdTokensFromModel(): { [key: string]: any } {
        return this.response.attestations.idTokens;
    }
}