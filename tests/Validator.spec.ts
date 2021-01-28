import { TokenType, ValidatorBuilder, IdTokenTokenValidator, VerifiableCredentialTokenValidator, VerifiablePresentationTokenValidator, IExpectedVerifiableCredential, IExpectedVerifiablePresentation, IExpectedIdToken, IExpectedSiop, IExpectedSelfIssued, Validator, CryptoBuilder, ManagedHttpResolver, ClaimToken } from '../lib/index';
import { IssuanceHelpers } from './IssuanceHelpers';
import TestSetup from './TestSetup';
import ValidationQueue from '../lib/input_validation/ValidationQueue';
import { Crypto, SelfIssuedTokenValidator } from '../lib/index';
import VerifiableCredentialConstants from '../lib/verifiable_credential/VerifiableCredentialConstants';
import { CryptoFactoryNode, IPayloadProtectionSigning, JoseBuilder, KeyReference, KeyStoreInMemory, KeyStoreKeyVault, KeyUse, LongFormDid, Subtle } from 'verifiablecredentials-crypto-sdk-typescript';
import Credentials from './Credentials';
import { ClientSecretCredential } from '@azure/identity';

describe('Validator', () => {
  let crypto: Crypto;
  let signingKeyReference: KeyReference;
  let setup: TestSetup;
  let originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  beforeEach(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
    setup = new TestSetup();
    signingKeyReference = setup.defaulSigKey;
    crypto = setup.crypto
    await setup.generateKeys();
  });
  afterEach(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    setup.fetchMock.reset();
  });

  it('should validate id token', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.idToken, true);
    const expected: IExpectedIdToken = siop.expected.filter((token: IExpectedIdToken) => token.type === TokenType.idToken)[0];

    // because we only pass in the id token we need to pass configuration as an array
    //expected.configuration = (<{ [contract: string]: string[]}>expected.configuration)[Validator.getContractIdFromSiop(siop.contract)];

    let tokenValidator = new IdTokenTokenValidator(setup.validatorOptions, expected);
    expect(() => tokenValidator.getTokens(<any>undefined, <any>undefined)).toThrowError('Not implemented');

    let selfIssuedValidator = new SelfIssuedTokenValidator(setup.validatorOptions, expected);
    expect(selfIssuedValidator.isType).toEqual(TokenType.selfIssued);
    expect(() => selfIssuedValidator.getTokens(<any>undefined, <any>undefined)).toThrowError('Not implemented');

    let validator = new ValidatorBuilder(crypto)
      .useValidators(tokenValidator)
      .useTrustedIssuerConfigurationsForIdTokens([setup.defaultIdTokenConfiguration])
      .build();

    let result = await validator.validate(siop.idToken.rawToken);
    expect(result.result).toBeTruthy();
    expect(result.validationResult?.idTokens).toBeDefined();

    validator = new ValidatorBuilder(crypto)
      .useTrustedIssuerConfigurationsForIdTokens([setup.defaultIdTokenConfiguration])
      .build();
    result = await validator.validate(siop.idToken.rawToken);
    expect(result.result).toBeTruthy();
    expect(result.validationResult?.idTokens).toBeDefined();

    //Redefine the urls
    validator = validator.builder.useTrustedIssuerConfigurationsForIdTokens([setup.defaultIdTokenConfiguration])
      .build();
    result = await validator.validate(siop.idToken.rawToken);
    expect(result.result).toBeTruthy();
    expect(validator.builder.trustedIssuerConfigurationsForIdTokens).toEqual([setup.defaultIdTokenConfiguration]);
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
    expect(() => tokenValidator.getTokens(<any>undefined, <any>undefined)).toThrowError('Not implemented');

    const validator = new ValidatorBuilder(crypto)
      .useValidators(tokenValidator)
      .build();

    let result = await validator.validate(siop.vc.rawToken);
    expect(result.result).toBeTruthy();

  });

  it('should validate verifiable presentations', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiablePresentationJwt, true);
    const vcExpected: IExpectedVerifiableCredential = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiableCredential)[0];
    const vpExpected: IExpectedVerifiablePresentation = siop.expected.filter((token: IExpectedVerifiablePresentation) => token.type === TokenType.verifiablePresentationJwt)[0];

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
      .enableFeatureVerifiedCredentialsStatusCheck(false)
      .build();

    // Check validator types
    expect(vpValidator.isType).toEqual(TokenType.verifiablePresentationJwt);
    expect(vcValidator.isType).toEqual(TokenType.verifiableCredential);

    // Check VP validator
    let queue = new ValidationQueue();
    queue.enqueueToken('vp', siop.vp);
    let result = await vpValidator.validate(queue, queue.getNextToken()!, setup.defaultUserDid);
    expect(result.result).toBeTruthy('vpValidator succeeded');
    expect(result.tokensToValidate![`DrivingLicense`].rawToken).toEqual(siop.vc.rawToken);

    // Check VC validator
    queue = new ValidationQueue();
    queue.enqueueToken(vcAttestationName, siop.vc);
    result = await vcValidator.validate(queue, queue.getNextToken()!, setup.defaultUserDid);
    expect(result.result).toBeTruthy('vcValidator succeeded');

    // Check validator
    queue = new ValidationQueue();
    queue.enqueueToken('vp', siop.vp);
    let token = queue.getNextToken()!.tokenToValidate;
    result = await validator.validate(token);
    expect(result.result).toBeTruthy('check validator');
    expect(result.validationResult?.verifiableCredentials).toBeDefined();

    // Negative cases
    // No validator
    validator = new ValidatorBuilder(crypto)
      .useValidators([])
      .build();
    queue = new ValidationQueue();
    queue.enqueueToken('vp', siop.vp);
    result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.result).toBeFalsy();
    expect(result.detailedError).toEqual('verifiablePresentationJwt does not has a TokenValidator');

    // Test validator with missing VC validator
    validator = new ValidatorBuilder(crypto)
      .useValidators(vpValidator)
      .enableFeatureVerifiedCredentialsStatusCheck(false)
      .build();
    queue = new ValidationQueue();
    queue.enqueueToken('vp', siop.vp);
    result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.result).toBeFalsy();
    expect(result.detailedError).toEqual('verifiableCredential does not has a TokenValidator');
  });

  it('should validate presentation siop', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiablePresentationJwt, false);
    const siopExpected = siop.expected.filter((token: IExpectedSiop) => token.type === TokenType.siopPresentationAttestation)[0];
    const vcExpected = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiableCredential)[0];


    // Check validator, only VCs in presentations
    let validator = new ValidatorBuilder(crypto)
      .useAudienceUrl(siopExpected.audience)
      .useTrustedIssuersForVerifiableCredentials(vcExpected.contractIssuers)
      .enableFeatureVerifiedCredentialsStatusCheck(false)
      .build();

    expect(validator.builder.audienceUrl).toEqual(siopExpected.audience);

    const queue = new ValidationQueue();
    queue.enqueueToken('siopPresentationAttestation', request);
    let result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.result).toBeTruthy();
    expect(result.status).toEqual(200);
    expect(validator.tokenValidators['siopPresentationAttestation'].isType).toEqual(TokenType.siopPresentationAttestation);
    expect(result.validationResult?.siop).toBeDefined();
    expect(result.validationResult?.verifiablePresentations).toBeDefined();
    expect(result.detailedError).toBeUndefined();
    expect(result.tokensToValidate).toBeUndefined();
    expect(result.validationResult?.did).toEqual(setup.defaultUserDid);
    expect(result.validationResult?.siopJti).toEqual(IssuanceHelpers.jti);
    expect(result.validationResult?.idTokens).toBeUndefined();
    expect(result.validationResult?.selfIssued).toBeUndefined();
    expect(result.validationResult?.verifiableCredentials).toBeDefined();
    expect(result.validationResult?.verifiableCredentials!['DrivingLicense'].decodedToken.vc.credentialSubject.givenName).toEqual('Jules');

    // Negative cases
    // map issuer to other credential type
    validator = validator.builder.useTrustedIssuersForVerifiableCredentials({ someCredential: vcExpected.contractIssuers.DrivingLicense }).build();
    queue.enqueueToken('siopPresentationAttestation', request);
    result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.result).toBeFalsy();
    expect(result.detailedError).toEqual(`Expected should have contractIssuers set for verifiableCredential. Missing contractIssuers for 'DrivingLicense'.`);
    expect(result.status).toEqual(403);

    // bad payload
    queue.enqueueToken('siopPresentationAttestation', <any>{claims: {}});
    result = await validator.validate(<any>queue.getNextToken()!);
    expect(result.detailedError).toEqual('Wrong token type. Expected string or ClaimToken');

    let spiedMethod: any = ClaimToken.create;
    let createSpy: jasmine.Spy = spyOn(ClaimToken, 'create').and.callFake((): ClaimToken => {
      throw new Error('some create error');
    });
    queue.enqueueToken('siopPresentationAttestation', request);
    result = await validator.validate(<any>queue.getNextToken()!.tokenToValidate.rawToken);
    expect(result.detailedError).toEqual('some create error');
    createSpy.and.callFake((token: any, id: any): { [key: string]: ClaimToken } => {
      return spiedMethod(token, id);
    });

    spiedMethod = ClaimToken.getClaimTokensFromAttestations;
    let getClaimTokensFromAttestationsSpy: jasmine.Spy = spyOn(ClaimToken, 'getClaimTokensFromAttestations').and.callFake((): { [key: string]: ClaimToken } => {
      throw new Error('some error');
    });
    queue.enqueueToken('siopPresentationAttestation', request);
    result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.detailedError).toEqual('some error');
    getClaimTokensFromAttestationsSpy.and.callFake((attestations: any): { [key: string]: ClaimToken } => {
      return spiedMethod(attestations);
    });

    spiedMethod = Validator.getClaimToken;
    let getClaimTokenSpy: jasmine.Spy = spyOn(Validator, 'getClaimToken').and.callFake((): ClaimToken => {
      throw new Error('some getClaimToken error');
    });
    queue.enqueueToken('siopPresentationAttestation', request);
    result = await validator.validate(<any>queue.getNextToken()!.tokenToValidate.rawToken);
    expect(result.detailedError).toEqual('some getClaimToken error');

    getClaimTokenSpy.and.callFake((): ClaimToken => {
      return <ClaimToken>{type: <any>'test'};
    });
    queue.enqueueToken('siopPresentationAttestation', request);
    validator.tokenValidators['test'] = validator.tokenValidators['siopPresentationAttestation'];
    result = await validator.validate(<any>queue.getNextToken()!.tokenToValidate.rawToken);
    expect(result.detailedError).toEqual(`test is not supported`);
    getClaimTokenSpy.and.callFake((queueItem: any): ClaimToken => {
      return spiedMethod(queueItem);
    });
  });


  xit('should validate siop and status', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiablePresentationJwt, true);
    const siopExpected = siop.expected.filter((token: IExpectedSiop) => token.type === TokenType.siopIssuance)[0];
    const vpExpected = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiablePresentationJwt)[0];
    const vcExpected = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiableCredential)[0];
    const idTokenExpected = siop.expected.filter((token: IExpectedIdToken) => token.type === TokenType.idToken)[0];
    const siExpected = siop.expected.filter((token: IExpectedSelfIssued) => token.type === TokenType.selfIssued)[0];


    // Check validator
    let validator = new ValidatorBuilder(crypto)
      .useAudienceUrl(siopExpected.audience)
      .useTrustedIssuerConfigurationsForIdTokens(idTokenExpected.configuration)
      .useTrustedIssuersForVerifiableCredentials(vcExpected.contractIssuers)
      .useResolver(new ManagedHttpResolver(VerifiableCredentialConstants.UNIVERSAL_RESOLVER_URL))
      .enableFeatureVerifiedCredentialsStatusCheck(true)
      .build();

    const queue = new ValidationQueue();
    queue.enqueueToken('siop', request);
    const result = await validator.validate(queue.getNextToken()!.tokenToValidate);
    expect(result.result).toBeTruthy(result.detailedError);
    expect(result.status).toEqual(200);

  });


  it('should validate siop with default validators', async () => {
    const [request, options, siop] = await IssuanceHelpers.createRequest(setup, TokenType.verifiablePresentationJwt, true);
    const siopExpected = siop.expected.filter((token: IExpectedSiop) => token.type === TokenType.siopIssuance)[0];
    const vpExpected = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiablePresentationJwt)[0];
    const vcExpected = siop.expected.filter((token: IExpectedVerifiableCredential) => token.type === TokenType.verifiableCredential)[0];
    const idTokenExpected = siop.expected.filter((token: IExpectedIdToken) => token.type === TokenType.idToken)[0];
    const siExpected = siop.expected.filter((token: IExpectedSelfIssued) => token.type === TokenType.selfIssued)[0];


    // Check validator
    let validator = new ValidatorBuilder(crypto)
      .useAudienceUrl(siopExpected.audience)
      .useTrustedIssuerConfigurationsForIdTokens(idTokenExpected.configuration)
      .useTrustedIssuersForVerifiableCredentials(vcExpected.contractIssuers)
      .useResolver(new ManagedHttpResolver(VerifiableCredentialConstants.UNIVERSAL_RESOLVER_URL))
      .enableFeatureVerifiedCredentialsStatusCheck(false)
      .build();

    expect(validator.resolver).toBeDefined();

    const queue = new ValidationQueue();
    queue.enqueueToken('siop', request);
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
    expect(result.validationResult?.selfIssued!.decodedToken.name).toEqual('jules');
    expect(result.validationResult?.verifiableCredentials).toBeDefined();
    expect(result.validationResult?.verifiableCredentials!['DrivingLicense'].decodedToken.vc.credentialSubject.givenName).toEqual('Jules');

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

  xit('should validate a siop', async () => {
    setup.fetchMock.reset();
    const credentials = new ClientSecretCredential(Credentials.tenantGuid, Credentials.clientId, Credentials.clientSecret);

    const keyReference = new KeyReference('jsonldtest', 'secret');    const subtle = new Subtle();
    const cryptoFactory = new CryptoFactoryNode(new KeyStoreKeyVault(credentials, Credentials.vaultUri, new KeyStoreInMemory()), subtle);
    let crypto = new CryptoBuilder()
      .useSigningAlgorithm('EdDSA')
      .useKeyVault(credentials, Credentials.vaultUri)
      .useCryptoFactory(cryptoFactory)
      .useSigningKeyReference(keyReference)
      .build();

    crypto = await crypto.generateKey(KeyUse.Signature);
    crypto = await crypto.generateKey(KeyUse.Signature, 'recovery');
    crypto = await crypto.generateKey(KeyUse.Signature, 'update');
    crypto.builder.useDid(await new LongFormDid(crypto).serialize());

    let validator = new ValidatorBuilder(crypto)
      .useAudienceUrl('https://verify.vc.capptoso.com:443/presentation-response')
      .useTrustedIssuersForVerifiableCredentials({ 'https://credentials.workday.com/docs/specification/v1.0/credential.json': ['did:work:CcZdQMaiwQyY2zA9njpx5p'] })
      .build();

    const req = 'your token here';
    console.log(req);
    const result = await validator.validate(req);
    expect(result.result).toBeTruthy();
    expect(result.status).toEqual(200);
  });
});