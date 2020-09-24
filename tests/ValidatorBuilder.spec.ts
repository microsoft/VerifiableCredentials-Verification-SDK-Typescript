/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Crypto, ValidatorBuilder, CryptoBuilder, ManagedHttpResolver } from '../lib/index';

describe('ValidatorBuilder', () => {
    it('should test status feature flag', () => {
        const crypto = new CryptoBuilder().build();
        let builder = new ValidatorBuilder(crypto);
        expect(builder.featureVerifiedCredentialsStatusCheckEnabled).toBeTruthy();
        
        builder = builder.enableFeatureVerifiedCredentialsStatusCheck(false);
        expect(builder.featureVerifiedCredentialsStatusCheckEnabled).toBeFalsy();
    });

    it('should use new resolver', () => {
        const crypto = new CryptoBuilder().build();
        let builder = new ValidatorBuilder(crypto);
        let resolver = builder.resolver;
        builder.useResolver(new ManagedHttpResolver('https://resolver.example.com'));
        expect(builder.resolver).not.toEqual(resolver);
    });
});
