/**
 * Class to model your presentation exchange request
 */

import { PresentationDefinitionModel } from '../../lib';

export default class PresentationDefinition {

    public static presentationExchangeDefinition: any = {

        name: 'Get driving license',
        purpose: 'Needed to provide you access to the site',
        input_descriptors: [
            {
                id: 'DrivingLicense',
                schema: {
                    uri: ['https://schema.org/testcredential'],
                    name: 'testcredential',
                    purpose: 'Testing the site'
                },
                issuance: [
                    {
                        manifest: 'https://portableidentitycards.azure-api.net/dev-v1.0/536279f6-15cc-45f2-be2d-61e352b51eef/portableIdentities/contracts/DrivingLicense'
                    }
                ]
            }
        ]
    }

}
