import { TokenType, ValidatorBuilder, IExpected, IdTokenTokenValidator, VerifiableCredentialTokenValidator, VerifiablePresentationTokenValidator } from '../lib/index';
import { IssuanceHelpers } from './IssuanceHelpers';
import TestSetup from './TestSetup';

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
    const expected = siop.expected.filter((token: IExpected) => token.type === TokenType.idToken)[0];

    const tokenValidator = new IdTokenTokenValidator();
    const validator = new ValidatorBuilder()
      .useValidators(tokenValidator)
      .build();
  
    const result = await validator.validate(siop.idToken.rawToken, expected);
    expect(result.result).toBeTruthy();
  });

  it ('should validate verifiable credentials', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, 'verifiable credential');   
    const expected = siop.expected.filter((token: IExpected) => token.type === TokenType.verifiableCredential)[0];

    const tokenValidator = new VerifiableCredentialTokenValidator();
    const validator = new ValidatorBuilder()
      .useValidators(tokenValidator)
      .expectedIssuers(['a', 'b'])
      .build();
  
    const result = await validator.validate(siop.vc.rawToken, expected);
    expect(result.result).toBeTruthy();
  });

  fit ('should validate verifiable presentations', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, 'verifiable presentation');   
    const expected = siop.expected.filter((token: IExpected) => token.type === TokenType.verifiablePresentation)[0];

    const tokenValidator = new VerifiablePresentationTokenValidator();
    const validator = new ValidatorBuilder()
      .useValidators(tokenValidator)
      .build();
  
    const result = await validator.validate(siop.vp.rawToken, expected);
    expect(result.result).toBeTruthy();
  });
});