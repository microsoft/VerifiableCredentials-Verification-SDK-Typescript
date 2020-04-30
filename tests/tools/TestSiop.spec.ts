import { TokenType, IdTokenValidation, ValidationOptions, ManagedHttpResolver, CryptoOptions, IExpected, VerifiablePresentationTokenValidator, VerifiableCredentialTokenValidator, IdTokenTokenValidator, SiopTokenValidator, SelfIssuedTokenValidator, ValidatorBuilder } from '../../lib';
import { KeyStoreInMemory, CryptoFactoryNode, SubtleCryptoNode, JoseProtocol } from '@microsoft/crypto-sdk';
import ToolHelpers from './ToolHelpers';

describe('tools - test SIOP', () => {
  it('should validate a SIOP', async () => {
    return;
    const siop = 'put your siop here';
    
    const expected: IExpected[] = [
      { type: TokenType.selfIssued },
      { type: TokenType.idToken, issuers: [''], audience: '' },
      { type: TokenType.siop, issuers: ['https://self-issued.me'], audience: '' },
      { type: TokenType.verifiablePresentation, issuers: ['userDid'] , audience: '' },
      { type: TokenType.verifiableCredential, issuers: ['issuerDid'], subject: 'userDid', contracts: [] }
    ];
    const siopExpected = expected.filter((token: IExpected) => token.type === TokenType.siop)[0];
    const vpExpected = expected.filter((token: IExpected) => token.type === TokenType.verifiablePresentation)[0];
    const vcExpected = expected.filter((token: IExpected) => token.type === TokenType.verifiableCredential)[0];
    const idTokenExpected = expected.filter((token: IExpected) => token.type === TokenType.idToken)[0];
    const siExpected = expected.filter((token: IExpected) => token.type === TokenType.selfIssued)[0];
    
    // the map gets its key from the created request
    const map: any = {
      siop: vcExpected
    };
    map['NameOfVp'] =  vcExpected;

    const options = ToolHelpers.getOptions();
    const vpValidator = new VerifiablePresentationTokenValidator(options.validatorOptions, vpExpected);
    const vcValidator = new VerifiableCredentialTokenValidator(options.validatorOptions, map);
    const idTokenValidator = new IdTokenTokenValidator(options.validatorOptions, idTokenExpected);
    const siopValidator = new SiopTokenValidator(options.validatorOptions, siopExpected);
    const siValidator = new SelfIssuedTokenValidator(options.validatorOptions, siExpected);

    let validator = new ValidatorBuilder()
    .useValidators([vcValidator, vpValidator, idTokenValidator, siopValidator, siValidator])
    .build();

    const result = await validator.validate(siop);
    expect(result.result).toBeTruthy();
  });
});