/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContractValidator } from '../lib/ContractValidation/ContractValidator';
import { ContractValidationResponse } from '../lib/ContractValidation/ContractValidationResponse';

describe('ContractValidator', () => {
  
  const validContract = {"id":"WoodgroveId","display":{"id":"display","locale":"en-US","contract":"https://portableidentitycards.azure-api.net/dev-v1.0/536279f6-15cc-45f2-be2d-61e352b51eef/portableIdentities/contracts/WoodgroveId","card":{"title":"Verified Employee","issuedBy":"Woodgrove","backgroundColor":"#391463","textColor":"#FFFFFF","logo":{"uri":"https://test-relyingparty.azurewebsites.net/images/woodgrove_logo.png","description":"Woodgrove logo"},"description":"Woodgrove Org Identity Card."},"consent":{"title":"Do you want to get your Woodgrove Identity Card?","instructions":"You will need to sign in with your Woodgrove credentials."},"claims":{"vc.credentialSubject.name":{"type":"String","label":"Name"},"vc.credentialSubject.email":{"type":"String","label":"Email"},"vc.credentialSubject.firstName":{"type":"String","label":"First Name"},"vc.credentialSubject.lastName":{"type":"String","label":"Last Name"}}},"input":{"id":"input","credentialIssuer":"https://portableidentitycards.azure-api.net/dev-v1.0/536279f6-15cc-45f2-be2d-61e352b51eef/portableIdentities/card/issue","issuer":"did:ion:EiDClccVJaiy6gDk6YW7PgZ9SjAUyVLc34_ITVMeFLEvdA?-ion-initial-state=eyJkZWx0YV9oYXNoIjoiRWlDTmMydnoxUWI0bzJSMFBoVGpDSDA0cGhZOVdwUEpCMEhJX0hDT0NyTHlvdyIsInJlY292ZXJ5X2tleSI6eyJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJFRXFVZmRzOUhtdUJBZ2V1bUtLbE1BZ2dhTjRvYXZtT3ZWLUhJZ1RLM1Y0IiwieSI6ImdIVlFablBZYkdBWkJicW9vRDJTS0VWNXBSaml5UGxFWjZ5VEZtMGpHNmcifSwicmVjb3ZlcnlfY29tbWl0bWVudCI6IkVpQnYzdWFXTXBIQXhNRlJ2WVd5LVlwSDRISE5MQW1KSWpyUzllRTFZcnNiMlEifQ.eyJ1cGRhdGVfY29tbWl0bWVudCI6IkVpQ2VJQ0dCT09EbDVqSXRUSHJzLWNDd2RfcnQtckhobElnQkQweXJ0aEFBWWciLCJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJzaWdfOTdhN2VlOTUiLCJ0eXBlIjoiRWNkc2FTZWNwMjU2azFWZXJpZmljYXRpb25LZXkyMDE5IiwiandrIjp7Imt0eSI6IkVDIiwiY3J2Ijoic2VjcDI1NmsxIiwieCI6Ik9XNzBWOEpNOHpoQVZSZTloRUp5Z1ZwTlJPalZHbjJpcW5qbUl0REVhM3ciLCJ5IjoiOTJUV3gzbVBJZHpwQ2xMTHRzdUNwTUROZ1FwMlc5SERiNGY3dlFzMGhvbyJ9LCJ1c2FnZSI6WyJvcHMiLCJhdXRoIiwiZ2VuZXJhbCJdfV19fV19","attestations":{"idTokens":[{"encrypted":false,"claims":[{"claim":"name","required":false,"indexed":false},{"claim":"upn","required":false,"indexed":false},{"claim":"given_name","required":false,"indexed":false},{"claim":"family_name","required":false,"indexed":false}],"required":false,"configuration":"https://login.microsoftonline.com/woodgrove.ms/.well-known/openid-configuration","client_id":"40be4fb5-7f3a-470b-aa37-66ed43821bd7","redirect_uri":"https://didwebtest.azurewebsites.net/verify"}]}}};
  const invalidContractNoDisplayAndInput = {"id":"WoodgroveId"};
  const invalidContractNoContract = {"id":"WoodgroveId","display":{"id":"display","locale":"en-US","card":{"title":"Verified Employee","issuedBy":"Woodgrove","backgroundColor":"#391463","textColor":"#FFFFFF","logo":{"uri":"https://test-relyingparty.azurewebsites.net/images/woodgrove_logo.png","description":"Woodgrove logo"},"description":"Woodgrove Org Identity Card."},"consent":{"title":"Do you want to get your Woodgrove Identity Card?","instructions":"You will need to sign in with your Woodgrove credentials."},"claims":{"vc.credentialSubject.name":{"type":"String","label":"Name"},"vc.credentialSubject.email":{"type":"String","label":"Email"},"vc.credentialSubject.firstName":{"type":"String","label":"First Name"},"vc.credentialSubject.lastName":{"type":"String","label":"Last Name"}}},"input":{"id":"input","credentialIssuer":"https://portableidentitycards.azure-api.net/dev-v1.0/536279f6-15cc-45f2-be2d-61e352b51eef/portableIdentities/card/issue","issuer":"did:ion:EiDClccVJaiy6gDk6YW7PgZ9SjAUyVLc34_ITVMeFLEvdA?-ion-initial-state=eyJkZWx0YV9oYXNoIjoiRWlDTmMydnoxUWI0bzJSMFBoVGpDSDA0cGhZOVdwUEpCMEhJX0hDT0NyTHlvdyIsInJlY292ZXJ5X2tleSI6eyJrdHkiOiJFQyIsImNydiI6InNlY3AyNTZrMSIsIngiOiJFRXFVZmRzOUhtdUJBZ2V1bUtLbE1BZ2dhTjRvYXZtT3ZWLUhJZ1RLM1Y0IiwieSI6ImdIVlFablBZYkdBWkJicW9vRDJTS0VWNXBSaml5UGxFWjZ5VEZtMGpHNmcifSwicmVjb3ZlcnlfY29tbWl0bWVudCI6IkVpQnYzdWFXTXBIQXhNRlJ2WVd5LVlwSDRISE5MQW1KSWpyUzllRTFZcnNiMlEifQ.eyJ1cGRhdGVfY29tbWl0bWVudCI6IkVpQ2VJQ0dCT09EbDVqSXRUSHJzLWNDd2RfcnQtckhobElnQkQweXJ0aEFBWWciLCJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJzaWdfOTdhN2VlOTUiLCJ0eXBlIjoiRWNkc2FTZWNwMjU2azFWZXJpZmljYXRpb25LZXkyMDE5IiwiandrIjp7Imt0eSI6IkVDIiwiY3J2Ijoic2VjcDI1NmsxIiwieCI6Ik9XNzBWOEpNOHpoQVZSZTloRUp5Z1ZwTlJPalZHbjJpcW5qbUl0REVhM3ciLCJ5IjoiOTJUV3gzbVBJZHpwQ2xMTHRzdUNwTUROZ1FwMlc5SERiNGY3dlFzMGhvbyJ9LCJ1c2FnZSI6WyJvcHMiLCJhdXRoIiwiZ2VuZXJhbCJdfV19fV19","attestations":{"idTokens":[{"encrypted":false,"claims":[{"claim":"name","required":false,"indexed":false},{"claim":"upn","required":false,"indexed":false},{"claim":"given_name","required":false,"indexed":false},{"claim":"family_name","required":false,"indexed":false}],"required":false,"configuration":"https://login.microsoftonline.com/woodgrove.ms/.well-known/openid-configuration","client_id":"40be4fb5-7f3a-470b-aa37-66ed43821bd7","redirect_uri":"https://didwebtest.azurewebsites.net/verify"}]}}};
  
  
  describe("validate()", () => {
    
    const validator = new ContractValidator()
    
    it('should validate contract', () => {
      const expectedValidatorResponse: ContractValidationResponse = {
        result: true,
        status: 200,
        contract: validContract
      }
      const actualValidatorResponse: ContractValidationResponse = validator.validate(validContract)
      expect(expectedValidatorResponse).toEqual(actualValidatorResponse)
    });
    
    it('should throw invalid contract error - no display and input', () => {
      const expectedValidatorResponse: ContractValidationResponse = {
        result: false,
        status: 400,
        contract: invalidContractNoDisplayAndInput
      }
      const actualValidatorResponse: ContractValidationResponse = validator.validate(invalidContractNoDisplayAndInput)
      expect(expectedValidatorResponse).toEqual(actualValidatorResponse)
    });
    
    it("should throw invalid contract error - no contract", () => {
      const expectedValidatorResponse: ContractValidationResponse = {
        result: false,
        status: 400,
        contract: invalidContractNoContract
      }
      const actualValidatorResponse: ContractValidationResponse = validator.validate(invalidContractNoContract)
      expect(expectedValidatorResponse).toEqual(actualValidatorResponse)
    });
  });
  
})