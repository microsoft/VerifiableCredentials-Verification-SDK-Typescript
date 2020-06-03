import { TokenType, ValidatorBuilder, IdTokenTokenValidator, VerifiableCredentialTokenValidator, VerifiablePresentationTokenValidator, IExpectedVerifiableCredential, IExpectedVerifiablePresentation, IExpectedIdToken, IExpectedSiop, IExpectedSelfIssued, Validator } from '../lib/index';
import { IssuanceHelpers } from './IssuanceHelpers';
import TestSetup from './TestSetup';
import ValidationQueue from '../lib/InputValidation/ValidationQueue';
import { SiopTokenValidator, SelfIssuedTokenValidator } from '../lib/index';
import SiopValidationSimulation from './SiopValidationSimulation';

describe('SiopValidationSimulation', () => {
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
  });
  afterEach(async () => {
    setup.fetchMock.reset();
  });
/*
  xit('should validate the ProofOfResidenceCredential', async () =>{
        // Token to test - ProofOfResidence
        const token = SiopValidationSimulation.token;
        
        const vpValidator = new VerifiablePresentationTokenValidator(setup.validatorOptions, SiopValidationSimulation.vpExpected);
        const vcValidator = new VerifiableCredentialTokenValidator(setup.validatorOptions, SiopValidationSimulation.vcExpected);
        const siopValidator = new SiopTokenValidator(setup.validatorOptions, SiopValidationSimulation.siopExpected);
        const siValidator = new SelfIssuedTokenValidator(setup.validatorOptions, SiopValidationSimulation.siExpected);
    
    // Check validator
    let validator = new ValidatorBuilder()
      .useValidators([vcValidator, vpValidator, siopValidator, siValidator])
      .build();

    const queue = new ValidationQueue();
    queue.enqueueToken('siop', token);
    const result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.result).toBeTruthy();

  });
*/
});