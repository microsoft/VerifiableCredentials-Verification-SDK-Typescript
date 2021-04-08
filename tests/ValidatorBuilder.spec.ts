/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Crypto, ValidatorBuilder, CryptoBuilder, ManagedHttpResolver, RequestorBuilder, BasicValidatorOptions, FetchRequest } from '../lib/index';

describe('ValidatorBuilder', () => {
  it('should test status feature flag', () => {
    const options = new BasicValidatorOptions();
    let builder = new ValidatorBuilder(options.crypto);
    expect(builder.featureVerifiedCredentialsStatusCheckEnabled).toBeTruthy();

    builder = builder.enableFeatureVerifiedCredentialsStatusCheck(false);
    expect(builder.featureVerifiedCredentialsStatusCheckEnabled).toBeFalsy();
  });

  it('should return validationOptions', () => {
    const resolver = new ManagedHttpResolver('https://example.com');
    const fetchRequest = new FetchRequest();
    const options = new BasicValidatorOptions();
    let builder = new ValidatorBuilder(options.crypto)
      .useFetchRequest(fetchRequest)
      .useMaxSizeOfVPTokensInSiop(options.validationSafeguards.maxSizeOfVPTokensInSiop)
      .useResolver(resolver);
    expect(builder.crypto).toEqual(builder.validationOptions.crypto);
    expect(builder.fetchRequest).toEqual(builder.validationOptions.fetchRequest);
    expect(builder.resolver).toEqual(builder.validationOptions.resolver);
  });

  it('should use new resolver', () => {
    let options = new BasicValidatorOptions();
    let builder = new ValidatorBuilder(options.crypto);
    let resolver = builder.resolver;
    builder.useResolver(new ManagedHttpResolver('https://resolver.example.com'));
    expect(builder.resolver).not.toEqual(resolver);

    resolver = new ManagedHttpResolver('https://resolver.example.com');
    options = new BasicValidatorOptions(resolver);
    builder = new ValidatorBuilder(options.crypto);
    expect(resolver).toEqual(options.resolver);
    expect(options.fetchRequest).toBeDefined();
  });

  it('should set state', () => {
    const crypto = new CryptoBuilder().build();
    let builder = new ValidatorBuilder(crypto);
    expect(builder.state).toBeUndefined();

    builder = new ValidatorBuilder(crypto)
      .useState('12345');
    expect(builder.state).toEqual('12345');

    let requestor = new RequestorBuilder(<any>{})
      .useState('abcdef');
    builder = new ValidatorBuilder(crypto)
      .useState('12345');
    expect(builder.state).toEqual('12345');
  });

  it('should set nonce', () => {
    const crypto = new CryptoBuilder().build();
    let builder = new ValidatorBuilder(crypto);
    expect(builder.nonce).toBeUndefined();

    builder = new ValidatorBuilder(crypto)
      .useNonce('12345');
    expect(builder.nonce).toEqual('12345');

    let requestor = new RequestorBuilder(<any>{})
      .useNonce('abcdef');
    builder = new ValidatorBuilder(crypto)
      .useNonce('12345')
    expect(builder.nonce).toEqual('12345');
  });

  it('should modify validation safeguards', () => {
    const crypto = new CryptoBuilder().build();
    let builder = new ValidatorBuilder(crypto);

    //builder.useMaxNumberOfIdTokensInSiop = 20;
    //expect(safeguards.maxNumberOfIdTokensInSiop).toEqual(20);
    builder.useMaxNumberOfVCTokensInPresentation(25);
    expect(builder.maxNumberOfVCTokensInPresentation).toEqual(25);
    //builder.useMaxNumberOfVPTokensInSiop = 30;
    //expect(builder.maxNumberOfVPTokensInSiop).toEqual(30);
    builder.useMaxSizeOfIdToken(40);
    expect(builder.maxSizeOfIdToken).toEqual(40);
    builder.useMaxSizeOfVCTokensInPresentation(50);
    expect(builder.maxSizeOfVCTokensInPresentation).toEqual(50);
    builder.useMaxSizeOfVPTokensInSiop(60);
    expect(builder.maxSizeOfVPTokensInSiop).toEqual(60);
  });

});
