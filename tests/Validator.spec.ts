import { TokenType, ValidatorBuilder, IdTokenTokenValidator, VerifiableCredentialTokenValidator, VerifiablePresentationTokenValidator, IExpectedVerifiableCredential, IExpectedVerifiablePresentation, IExpectedIdToken, IExpectedSiop, IExpectedSelfIssued, Validator, CryptoBuilder } from '../lib/index';
import { IssuanceHelpers } from './IssuanceHelpers';
import TestSetup from './TestSetup';
import ValidationQueue from '../lib/InputValidation/ValidationQueue';
import { Crypto, SiopTokenValidator, SelfIssuedTokenValidator } from '../lib/index';
import { IssuerMap } from '../lib/Options/IExpected';

describe('Validator', () => {
  let crypto: Crypto;
  let signingKeyReference: string;
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
    signingKeyReference = setup.defaulSigKey;
    crypto = setup.crypto
    await setup.generateKeys();
  });
  afterEach(async () => {
    setup.fetchMock.reset();
  });

  it('should validate id token', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.idToken, true);
    const expected: IExpectedIdToken = siop.expected.filter((token: IExpectedIdToken) => token.type === TokenType.idToken)[0];

    // because we only pass in the id token we need to pass configuration as an array
    //expected.configuration = (<{ [contract: string]: string[]}>expected.configuration)[Validator.getContractIdFromSiop(siop.contract)];

    let tokenValidator = new IdTokenTokenValidator(setup.validatorOptions, expected);
    let validator = new ValidatorBuilder(crypto)
      .useValidators(tokenValidator)
      .build();

    let result = await validator.validate(siop.idToken.rawToken);
    expect(result.result).toBeTruthy(); 
    expect(result.validationResult?.idTokens).toBeDefined();
    expect(result.validationResult?.verifiablePresentations).toBeUndefined();

    tokenValidator = new IdTokenTokenValidator(setup.validatorOptions, expected);

    // Negative cases
    expected.configuration = ['xxx'];
    tokenValidator = new IdTokenTokenValidator(setup.validatorOptions, expected);
    validator = new ValidatorBuilder(crypto)
      .useValidators(tokenValidator)
      .build();

    result = await validator.validate(siop.idToken.rawToken);
    expect(result.result).toBeFalsy();
    expect(result.detailedError).toEqual(`Could not fetch token configuration`);
  });

  it('should validate verifiable credentials', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiableCredential, true);
    const expected: any = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiableCredential)[0];

    const tokenValidator = new VerifiableCredentialTokenValidator(setup.validatorOptions, expected);
    const validator = new ValidatorBuilder(crypto)
      .useValidators(tokenValidator)
      .build();

    const result = await validator.validate(siop.vc.rawToken);
    expect(result.result).toBeTruthy();
  });

  it('should validate verifiable presentations', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiablePresentation, true);
    const vcExpected: IExpectedVerifiableCredential = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiableCredential)[0];
    const vpExpected: IExpectedVerifiablePresentation = siop.expected.filter((token: IExpectedVerifiablePresentation) => token.type === TokenType.verifiablePresentation)[0];

    // the map gets its key from the created request
    const vcAttestationName = Object.keys(siop.attestations.presentations)[0];
    const map: any = {
      siop: vcExpected
    };
    map[vcAttestationName] = vcExpected;

    const vpValidator = new VerifiablePresentationTokenValidator(setup.validatorOptions, crypto, vpExpected);
    const vcValidator = new VerifiableCredentialTokenValidator(setup.validatorOptions, map);
    let validator = new ValidatorBuilder(crypto)
      .useValidators([vcValidator, vpValidator])
      .build();

    // Check validator types
    expect(vpValidator.isType).toEqual(TokenType.verifiablePresentation);
    expect(vcValidator.isType).toEqual(TokenType.verifiableCredential);

    // Check VP validator
    let queue = new ValidationQueue();
    queue.enqueueToken('vp', siop.vp.rawToken);
    let result = await vpValidator.validate(queue, queue.getNextToken()!, setup.defaultUserDid);
    expect(result.result).toBeTruthy('vpValidator succeeded');
    expect(result.tokensToValidate![`vp`].rawToken).toEqual(siop.vc.rawToken);

    // Check VC validator
    queue = new ValidationQueue();
    queue.enqueueToken(vcAttestationName, siop.vc.rawToken);
    result = await vcValidator.validate(queue, queue.getNextToken()!, setup.defaultUserDid);
    expect(result.result).toBeTruthy('vcValidator succeeded');

    // Check validator
    queue = new ValidationQueue();
    queue.enqueueToken('vp', siop.vp.rawToken);
    result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.result).toBeTruthy('check validator');
    expect(result.validationResult?.verifiableCredentials).toBeDefined();

    // Negative cases
    // Test validator with missing VC validator
    validator = new ValidatorBuilder(crypto)
      .useValidators(vpValidator)
      .build();
    queue = new ValidationQueue();
    queue.enqueueToken('vp', siop.vp.rawToken);
    expectAsync(validator.validate(queue.getNextToken()!.tokenToValidate)).toBeRejectedWith('verifiableCredential does not has a TokenValidator');
  });

  it('should validate presentation siop', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiablePresentation, false);
    const siopExpected = siop.expected.filter((token: IExpectedSiop) => token.type === TokenType.siopPresentation)[0];
    const vcExpected = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiableCredential)[0];
    

    // Check validator, only VCs in presentations
    let validator = new ValidatorBuilder(crypto)
      .useAudienceUrl(siopExpected.audience)
      .useTrustedIssuersForVerifiableCredentials(vcExpected.contractIssuers)
      .build();

    const queue = new ValidationQueue();
    queue.enqueueToken('siopPresentation', request.rawToken);
    let result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.result).toBeTruthy();
    expect(result.status).toEqual(200);
    expect(result.validationResult?.siop).toBeDefined();
    expect(result.validationResult?.verifiablePresentations).toBeDefined();
    expect(result.detailedError).toBeUndefined();
    expect(result.tokensToValidate).toBeUndefined();
    expect(result.validationResult?.did).toEqual(setup.defaultUserDid);
    expect(result.validationResult?.siopJti).toEqual(IssuanceHelpers.jti);
    expect(result.validationResult?.idTokens).toBeUndefined();
    expect(result.validationResult?.selfIssued).toBeUndefined();
    expect(result.validationResult?.verifiableCredentials).toBeDefined();
    expect(result.validationResult?.verifiableCredentials!['VerifiableCredential'].decodedToken.vc.credentialSubject.givenName).toEqual('Jules');

    // Negative cases
    // map issuer to other credential type
    validator = validator.builder.useTrustedIssuersForVerifiableCredentials({ someCredential: vcExpected.contractIssuers.DrivingLicense }).build();
    queue.enqueueToken('siopPresentation', request.rawToken);
    result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.result).toBeFalsy();
    expect(result.detailedError).toEqual(`Expected should have contractIssuers issuers set for verifiableCredential. Missing contractIssuers for 'DrivingLicense'.`);
    expect(result.status).toEqual(403);
  });


  it('should validate siop with default validators', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiablePresentation, true);
    const siopExpected = siop.expected.filter((token: IExpectedSiop) => token.type === TokenType.siopIssuance)[0];
    const vpExpected = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiablePresentation)[0];
    const vcExpected = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiableCredential)[0];
    const idTokenExpected = siop.expected.filter((token: IExpectedIdToken) => token.type === TokenType.idToken)[0];
    const siExpected = siop.expected.filter((token: IExpectedSelfIssued) => token.type === TokenType.selfIssued)[0];


    // Check validator
    let validator = new ValidatorBuilder(crypto)
      .useAudienceUrl(siopExpected.audience)
      .useTrustedIssuerConfigurationsForIdTokens(idTokenExpected.configuration)
      .useTrustedIssuersForVerifiableCredentials(vcExpected.contractIssuers)
      .build();

    const queue = new ValidationQueue();
    queue.enqueueToken('siop', request.rawToken);
    const result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.result).toBeTruthy();
    expect(result.status).toEqual(200);
    expect(result.detailedError).toBeUndefined();
    expect(result.tokensToValidate).toBeUndefined();
    expect(result.validationResult?.did).toEqual(setup.defaultUserDid);
    expect(result.validationResult?.siopJti).toEqual(IssuanceHelpers.jti);
    expect(result.validationResult?.siop).toBeDefined();
    expect(result.validationResult?.verifiablePresentations).toBeDefined();
    expect(result.validationResult?.idTokens).toBeDefined();
    for (let idtoken in result.validationResult?.idTokens) {
      expect(result.validationResult?.idTokens[idtoken].decodedToken.upn).toEqual('jules@pulpfiction.com');
    }
    expect(result.validationResult?.selfIssued).toBeDefined();
    expect(result.validationResult?.selfIssued.decodedToken.name).toEqual('jules');
    expect(result.validationResult?.verifiableCredentials).toBeDefined();
    expect(result.validationResult?.verifiableCredentials!['VerifiableCredential'].decodedToken.vc.credentialSubject.givenName).toEqual('Jules');

    // Negative cases

  });

  it('should validate siop', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiablePresentation, true);
    const siopExpected = siop.expected.filter((token: IExpectedSiop) => token.type === TokenType.siopIssuance)[0];
    const vpExpected = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiablePresentation)[0];
    const vcExpected = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiableCredential)[0];
    const idTokenExpected = siop.expected.filter((token: IExpectedIdToken) => token.type === TokenType.idToken)[0];
    const siExpected = siop.expected.filter((token: IExpectedSelfIssued) => token.type === TokenType.selfIssued)[0];

    const vpValidator = new VerifiablePresentationTokenValidator(setup.validatorOptions, crypto, vpExpected);
    const vcValidator = new VerifiableCredentialTokenValidator(setup.validatorOptions, vcExpected);
    const idTokenValidator = new IdTokenTokenValidator(setup.validatorOptions, idTokenExpected);
    const siopValidator = new SiopTokenValidator(setup.validatorOptions, siopExpected);
    const siValidator = new SelfIssuedTokenValidator(setup.validatorOptions, siExpected);

    // Check validator types
    expect(vpValidator.isType).toEqual(TokenType.verifiablePresentation);
    expect(vcValidator.isType).toEqual(TokenType.verifiableCredential);
    expect(idTokenValidator.isType).toEqual(TokenType.idToken);
    expect(siopValidator.isType).toEqual(TokenType.siopIssuance);
    expect(siValidator.isType).toEqual(TokenType.selfIssued);

    // Check siop validator
    let queue = new ValidationQueue();
    queue.enqueueToken('siop', request.rawToken);
    let result = await siopValidator.validate(queue, queue.getNextToken()!);
    expect(result.result).toBeTruthy();
    expect(result.tokensToValidate!['VerifiableCredential'].rawToken).toEqual(siop.vp.rawToken);
    expect(result.tokensToValidate![`${setup.defaultIdTokenConfiguration}`].rawToken).toEqual(siop.idToken.rawToken);
    expect(result.tokensToValidate!['selfIssued'].rawToken).toEqual(siop.si.rawToken);

    // Check validator
    let validator = new ValidatorBuilder(crypto)
      .useValidators([vcValidator, vpValidator, idTokenValidator, siopValidator, siValidator])
      .build();

    queue = new ValidationQueue();
    queue.enqueueToken('siop', request.rawToken);
    result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.result).toBeTruthy();
    expect(result.status).toEqual(200);
    expect(result.detailedError).toBeUndefined();
    expect(result.tokensToValidate).toBeUndefined();
    expect(result.validationResult?.did).toEqual(setup.defaultUserDid);
    expect(result.validationResult?.siopJti).toEqual(IssuanceHelpers.jti);
    expect(result.validationResult?.idTokens).toBeDefined();
    for (let idtoken in result.validationResult?.idTokens) {
      expect(result.validationResult?.idTokens[idtoken].decodedToken.upn).toEqual('jules@pulpfiction.com');
    }
    expect(result.validationResult?.selfIssued).toBeDefined();
    expect(result.validationResult?.selfIssued.decodedToken.name).toEqual('jules');
    expect(result.validationResult?.verifiableCredentials).toBeDefined();
    expect(result.validationResult?.verifiableCredentials!['VerifiableCredential'].decodedToken.vc.credentialSubject.givenName).toEqual('Jules');

    // Negative cases

  });

  it('should read the contract id with no spaces', () => {
    const id = 'foo';
    const url = `https://test.com/v1.0/abc/def/contracts/${id}`;
    const result = Validator.readContractId(url);
    expect(result).toEqual(id);
  });

  it('should read the contract id with spaces', () => {
    const id = 'foo bar';
    const url = `https://test.com/v1.0/abc/def/contracts/${encodeURIComponent(id)}`;
    const result = Validator.readContractId(url);
    expect(result).toEqual(id);
  });

  it('should read the contract id with spaces and query', () => {
    const id = 'foo bar';
    const url = `https://test.com/v1.0/abc/def/contracts/${encodeURIComponent(id)}?qs=abcdefggh`;
    const result = Validator.readContractId(url);
    expect(result).toEqual(id);
  });


});