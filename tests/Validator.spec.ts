import { TokenType, ValidatorBuilder, IExpected, IdTokenTokenValidator, VerifiableCredentialTokenValidator, VerifiablePresentationTokenValidator } from '../lib/index';
import { IssuanceHelpers } from './IssuanceHelpers';
import TestSetup from './TestSetup';
import ValidationQueue from '../lib/InputValidation/ValidationQueue';

describe('Validator', () => {
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
  });
  afterEach(async () => {
    setup.fetchMock.reset();
  });

  it ('should validate id token', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, 'id token');   
    const expected: IExpected = siop.expected.filter((token: IExpected) => token.type === TokenType.idToken)[0];

    let tokenValidator = new IdTokenTokenValidator(setup.validatorOptions, expected);
    let validator = new ValidatorBuilder()
      .useValidators(tokenValidator)
      .build();
  
    let result = await validator.validate(siop.idToken.rawToken);
    expect(result.result).toBeTruthy();tokenValidator = new IdTokenTokenValidator(setup.validatorOptions, expected);
    
    // Negative cases
    expected.issuers = ['xxx'];
    tokenValidator = new IdTokenTokenValidator(setup.validatorOptions, expected);
    validator = new ValidatorBuilder()
      .useValidators(tokenValidator)
      .build();
  
    result = await validator.validate(siop.idToken.rawToken);
    expect(result.result).toBeFalsy();
    expect(result.detailedError).toEqual(`Wrong or missing iss property in id token. Expected '["xxx"]'`);
  });

  it ('should validate verifiable credentials', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, 'verifiable credential');   
    const expected = siop.expected.filter((token: IExpected) => token.type === TokenType.verifiableCredential)[0];

    const tokenValidator = new VerifiableCredentialTokenValidator(setup.validatorOptions, expected);
    const validator = new ValidatorBuilder()
      .useValidators(tokenValidator)
     // TODO .expectedIssuers(['a', 'b'])
      .build();
  
    const result = await validator.validate(siop.vc.rawToken);
    expect(result.result).toBeTruthy();
  });

  it ('should validate verifiable presentations', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, 'verifiable presentation');   
    const vpExpected = siop.expected.filter((token: IExpected) => token.type === TokenType.verifiablePresentation)[0];
    const vcExpected = siop.expected.filter((token: IExpected) => token.type === TokenType.verifiableCredential)[0];

    const vpValidator = new VerifiablePresentationTokenValidator(setup.validatorOptions, vpExpected);
    const vcValidator = new VerifiableCredentialTokenValidator(setup.validatorOptions, vcExpected);
    let validator = new ValidatorBuilder()
      .useValidators([vcValidator, vpValidator])
      .build();

    // Check validator types
    expect(vpValidator.isType).toEqual(TokenType.verifiablePresentation);
    expect(vcValidator.isType).toEqual(TokenType.verifiableCredential);

    // Check VP validator
    let queue = new ValidationQueue();
    queue.addToken(siop.vp.rawToken);
    let result = await vpValidator.validate(queue, queue.getNextToken()!);
    expect(result.result).toBeTruthy();
    expect(result.tokensToValidate![0]).toEqual(siop.vc.rawToken);

    // Check VC validator
    queue = new ValidationQueue();
    queue.addToken(siop.vc.rawToken);
    result = await vcValidator.validate(queue, queue.getNextToken()!);
    expect(result.result).toBeTruthy();

    // Check validator
    queue = new ValidationQueue();
    queue.addToken(siop.vp.rawToken);
    result = await validator.validate(queue.getNextToken()!.token);
    expect(result.result).toBeTruthy();
    expect(result.tokensToValidate).toBeUndefined();

    // Negative cases
    // Test validator with missing VC validator
    validator = new ValidatorBuilder()
      .useValidators(vpValidator)
      .build();
    queue = new ValidationQueue();
    queue.addToken(siop.vp.rawToken);
    expectAsync(validator.validate(queue.getNextToken()!.token)).toBeRejectedWith('verifiableCredential does not has a TokenValidator');
  });
});