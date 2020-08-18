/**
 * Class to model your presentation exchange request
 */

import { PresentationDefinitionModel } from '../../lib';

export default class RequestOnceVcResponseOk {
    public static clientId = 'https://requestor.example.com';
    public static presentationExchangeRequest: any = {
        clientId: RequestOnceVcResponseOk.clientId,
        clientName: 'My relying party',
        clientPurpose: 'Need your VC to provide access',
        redirectUri: RequestOnceVcResponseOk.clientId,
        tosUri: 'https://tosUri.example.com',
        logoUri: 'https://logoUri.example.com',

        presentationDefinition: {
            name: 'Get identity card',
            purpose: 'Needed to provide you access to the site',
            input_descriptors: [
                {
                    id: 'IdentityCard',
                    schema: {
                        uri: ['https://schema.org/IdentityCardCredential'],
                        name: 'IdentityCard',
                        purpose: 'Testing the site'
                    },
                    issuance: [
                        {
                            manifest: 'https://portableidentitycards.azure-api.net/dev-v1.0/536279f6-15cc-45f2-be2d-61e352b51eef/portableIdentities/contracts/IdentityCard1'
                        }
                    ]
                }
            ]
        }
    }


    public static presentationExchangeResponse: any = {
        fills: {
            did: '$.did',
            state: '$.state',
            nonce: '$.nonce',
            status: {
                
            }
        },
        iss: 'https://self-issued.me',
        aud: RequestOnceVcResponseOk.clientId,
        nonce: '',
        state: '',
        did: '',
        jti: 'fa8fdc8f-d95b-4237-9c90-9696112f4e19',
        presentation_submission: {
            descriptor_map: [
                {
                    id: 'Identity_card ',
                    format: 'jwt',
                    encoding: 'base64Url',
                    path: '$.attestations.presentations'
                }
            ]
        },
        attestations: {
            presentations: {
                Identity_card: ''
            },
            status: {
                Identity_card: {
                    'urn:pic:1': ''
                }
            }
        }
    }
}