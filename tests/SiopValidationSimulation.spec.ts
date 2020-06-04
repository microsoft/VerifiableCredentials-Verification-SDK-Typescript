import { ValidatorBuilder } from '../lib/index';
import TestSetup from './TestSetup';
import ValidationQueue from '../lib/InputValidation/ValidationQueue';
import SiopValidationSimulation from './SiopValidationSimulation';

describe('SiopValidationSimulation', () => {
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
    setup.fetchMock.reset();
  });
  afterEach(async () => {
    setup.fetchMock.reset();
  });
  it('should validate the WoodgroveIdentityCredential', async () =>{
        // Token to test - WoodgroveIdentityCredential
        const token = SiopValidationSimulation.token;
           
    // Check validator
    let validator = new ValidatorBuilder(setup.crypto)
      .useTrustedIssuerConfigurationsForIdTokens(['https://login.microsoftonline.com/woodgrove.ms/.well-known/openid-configuration'])    
      .useAudienceUrl(SiopValidationSimulation.siopExpected.audience!)
      .build();

    const queue = new ValidationQueue();
    queue.enqueueToken('siopPresentation', token);
    const result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.result).toBeTruthy();

  });

});