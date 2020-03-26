import { TokenValidator, TokenType, ValidatorBuilder, IExpected } from '../lib/index';
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

    const tokenValidator = new TokenValidator(TokenType.idToken);
    const validator = new ValidatorBuilder()
      .useValidators(tokenValidator)
      .build();
  
    const result = await validator.validate(siop.idToken.rawToken, expected);
    expect(result.result).toBeTruthy();
  });
});