/**
 * Class to model your presentation exchange request
 */

import ITestModel from "./ITestModel";
import { ClaimToken, TokenType } from "../../lib";


export default class RequestTwoVcResponseOk implements ITestModel {
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
        },
        {
          id: 'Diploma',
          schema: {
            uri: ['https://schema.org/Diploma'],
            name: 'Diploma',
            purpose: 'Proving diploma'
          },
          issuance: [
            {
              manifest: 'https://portableidentitycards.azure-api.net/dev-v1.0/536279f6-15cc-45f2-be2d-61e352b51eef/portableIdentities/contracts/Diploma'
            }
          ]
        }
      ]
    }
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
  public getPresentationsFromModel(): { [key: string]: any } {
    return this.response.presentation_submission.attestations.presentations;
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
  public getIdTokensFromModel(): { [key: string]: any } {
    return {};
  }
}