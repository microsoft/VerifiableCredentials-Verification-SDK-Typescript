/**
 * Class to model your SIOP request
 */

import ITestModel from "./ITestModel";
import { ClaimToken, TokenType, IRequestorAttestation } from "../../lib";
import ITestModelAttestations from "./ITestModelAttestations";


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

        "attestations": {
            "selfIssued": {
                "name": "Jules Winnfield",
                "birthDate": "1948-21-21T00:00:00"
            },
            "presentations": {
                "DriversLicenseCredential": {
                    "jti": "33b5f2ebf1b74e64825d2370eedd917c",
                    "purpose": "issue verify",
                    "vp": {
                        "@context": [
                            "https://www.w3.org/2018/credentials/v1"
                        ],
                        "type": [
                            "VerifiablePresentation"
                        ],
                        "verifiableCredential": [
                            {
                                "jti": "urn:pic:4Zjuv9ANPTL5az7VqEdi-Znx6zQCBAPF5s2ZC-9ybdQ",
                                "vc": {
                                    "@context": [
                                        "https://www.w3.org/2018/credentials/v1",
                                        "https://pics-linux.azurewebsites.net/test/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/vc"
                                    ],
                                    "type": [
                                        "VerifiableCredential",
                                        "DriversLicenseCredential"
                                    ],
                                    "credentialSubject": {
                                        "birthdate": "1948-21-21T00:00:00",
                                        "name": "Jules Winnfield",
                                        "organDonor": "true",
                                        "id": "JW123456"
                                    },
                                    "credentialStatus": {
                                        "id": "https://pics-linux.azurewebsites.net/test/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/vc/status",
                                        "type": "CredentialStatusResponseTest"
                                    }
                                },
                                "iss": "did:web:didwebtest.azurewebsites.net",
                                "sub": "did:ion:test:EiCAvQuaAu5awq_e_hXyJImdQ5-xJsZzzQ3Xd9a2EAphtQ"
                            }
                        ]
                    },
                    "aud": "did:ion:test:EiBzB06CB0kRI1SFfyyr3-2JXIGvpm9LPJ-2AT3motbQsw",
                    "iss": "did:ion:test:EiCAvQuaAu5awq_e_hXyJImdQ5-xJsZzzQ3Xd9a2EAphtQ"
                },
                "InsuranceCredential": {
                    "jti": "24770db42f0747368110f25d5e43b45c",
                    "purpose": "issue verify",
                    "vp": {
                        "@context": [
                            "https://www.w3.org/2018/credentials/v1"
                        ],
                        "type": [
                            "VerifiablePresentation"
                        ],
                        "verifiableCredential": [
                            {
                                "jti": "urn:pic:HU1DykCGpn5zo6wgs2RK5HoVheT31wVVoR6bKLzjwD4",
                                "vc": {
                                    "@context": [
                                        "https://www.w3.org/2018/credentials/v1",
                                        "https://pics-linux.azurewebsites.net/test/FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF/vc"
                                    ],
                                    "type": [
                                        "VerifiableCredential",
                                        "InsuranceCredential"
                                    ],
                                    "credentialSubject": {
                                        "model": "The Homer",
                                        "name": "Joey Jojo Junior Shabadoo",
                                        "make": "Powell Motors",
                                        "VIN": "123456789"
                                    },
                                    "credentialStatus": {
                                        "id": "https://pics-linux.azurewebsites.net/test/FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF/vc/status",
                                        "type": "CredentialStatusResponseTest"
                                    }
                                },
                                "iss": "did:web:didwebtest.azurewebsites.net",
                                "sub": "did:ion:test:EiCAvQuaAu5awq_e_hXyJImdQ5-xJsZzzQ3Xd9a2EAphtQ",
                                "iat": 1585242926,
                                "nbf": 1585242926,
                                "exp": 1585329326
                            }
                        ]
                    },
                    "iss": "did:ion:test:EiCS5Qmia9Pm8yurO1K2qIBppqw02NSzcaMO3WO4u6ZIzA",
                    "aud": "did:ion:test:EiCAvQuaAu5awq_e_hXyJImdQ5-xJsZzzQvvd9a2EAphtQ",
                    "iat": 1585242930,
                    "nbf": 1585242930,
                    "exp": 1585243230
                }
            },
            "idTokens": {
                "https://pics-linux.azurewebsites.net/test/oidc/openid-configuration": {
                    "firstName": "Jules",
                    "middleName": "Paul",
                    "lastName": "Winnfield",
                    "email": "jules@pulpfiction.com",
                    "role": "hitman",
                    "telephone": "4258058247",
                    "iss": "https://pics-linux.azurewebsites.net",
                    "iat": 1585242925,
                    "nbf": 1585242925,
                    "exp": 1585329325
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
        presentation_submission: {
            descriptor_map: [
                {
                    id: 'IdentityCard',
                    format: 'jwt',
                    encoding: 'base64Url',
                    path: '$.presentation_submission.attestations.presentations.IdentityCard'
                },
                {
                    id: 'Diploma',
                    format: 'jwt',
                    encoding: 'base64Url',
                    path: '$.presentation_submission.attestations.presentations.Diploma'
                }
            ],
            attestations: {
                presentations: {
                    IdentityCard: {
                        'jti': `urn:pic:IdentityCard`,
                        'vc': {
                            '\@context': [
                                'https://www.w3.org/2018/credentials/v1',
                                'https://portableidentitycards.azure-api.net/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/api/portable/v1.0/contracts/test/schema'
                            ],
                            'type': [
                                'VerifiableCredential',
                                'IdentityCard'
                            ],
                            'credentialSubject': {
                                givenName: 'Jules',
                                familyName: 'Winnfield',
                                profession: 'hitman'
                            },
                            'credentialStatus': {
                                'id': `https://status.example.com/IdentityCard`,
                                'type': 'PortableIdentityCardServiceCredentialStatus2020'
                            }
                        },
                    },
                    Diploma: {
                        'jti': `urn:pic:Diploma`,
                        'vc': {
                            '\@context': [
                                'https://www.w3.org/2018/credentials/v1',
                                'https://portableidentitycards.azure-api.net/42b39d9d-0cdd-4ae0-b251-b7b39a561f91/api/portable/v1.0/contracts/test/Diploma'
                            ],
                            'type': [
                                'VerifiableCredential',
                                'Diploma'
                            ],
                            'credentialSubject': {
                                level: 'master',
                                university: 'rentakill'
                            },
                            'credentialStatus': {
                                'id': `https://status.example.com/Diploma`,
                                'type': 'PortableIdentityCardServiceCredentialStatus2020'
                            }
                        },
                    },

                },
            }
        }
    }

    public responseStatus = {
        'IdentityCard': {
            'credentialStatus': {
                'status': 'valid',
                'reason': `Totally checked`
            }
        },
        'Diploma': {
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
        let claimToken = ClaimToken.create(this.response.presentation_submission.attestations.presentations[key]);

        claimToken = ClaimToken.create(claimToken.decodedToken.vp.verifiableCredential[0]);
        return claimToken;
    }


    /**
     * Return all presentations
     */
    public getPresentations(): { [key: string]: any } {
        return this.response.presentation_submission.attestations.presentations;
    }
}