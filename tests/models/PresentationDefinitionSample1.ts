/**
 * Class to model your presentation exchange request
 */

import { PresentationDefinitionModel } from '../../lib';

export default class PresentationDefinition {

    public static presentationExchangeDefinition: any = {
        clientId: 'https://requestor.example.com',
        clientName: 'My relying party',
        clientPurpose: 'Need your VC to provide access',
        redirectUri: 'https://response.example.com',
        tosUri: 'https://tosUri.example.com',
        logoUri: 'https://logoUri.example.com',

        presentationDefinition: {
            name: 'Get driving license',
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
}