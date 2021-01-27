/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { CryptoBuilder, IDidResolveResult, KeyReference, KeyUse, LongFormDid, ManagedHttpResolver, ValidatorBuilder } from '../lib';
import { ValidationHelpers } from '../lib/input_validation/ValidationHelpers';


describe('LongFormDid', () => {
  it('should generate and resolve a longform DID', async () => {
      let crypto = new CryptoBuilder()
          .useSigningKeyReference(new KeyReference('mars'))
          .useRecoveryKeyReference(new KeyReference('recovery'))
          .useUpdateKeyReference(new KeyReference('update'))
          .build();
      crypto = await crypto.generateKey(KeyUse.Signature);
      crypto = await crypto.generateKey(KeyUse.Signature, 'recovery');
      crypto = await crypto.generateKey(KeyUse.Signature, 'update');

      const jwk: any = await crypto.builder.keyStore.get(crypto.builder.signingKeyReference);
      let did = await new LongFormDid(crypto).serialize();
      expect(did.startsWith('did:ion')).toBeTruthy();

      const validator = new ValidatorBuilder(crypto)
        .useResolver(new ManagedHttpResolver('https://dev.discover.did.msidentity.com/1.0/identifiers'))        
        .build();

      // resolve DID
      const resolveResponse: IDidResolveResult = await validator.builder.resolver.resolve(did);
      expect(resolveResponse.didDocument.id).toEqual(did);
      let publicKey: any = ValidationHelpers.getPublicKeyFromDidDocument(resolveResponse.didDocument, `${did}#${crypto.builder.signingKeyReference.keyReference}`, did);
      expect(publicKey.x).toEqual(jwk.keys[0].x);
      expect(publicKey.y).toEqual(jwk.keys[0].y);
      expect(resolveResponse.didDocument.getServices()).toEqual([]);
  });
  it('should add services to the longform DID', async () => {
      let crypto = new CryptoBuilder()
          .useSigningKeyReference(new KeyReference('mars'))
          .useRecoveryKeyReference(new KeyReference('recovery'))
          .useUpdateKeyReference(new KeyReference('update'))
          .build();
      crypto = await crypto.generateKey(KeyUse.Signature);
      crypto = await crypto.generateKey(KeyUse.Signature, 'recovery');
      crypto = await crypto.generateKey(KeyUse.Signature, 'update');

      let did1 = await new LongFormDid(crypto).serialize();
      let did2 = await new LongFormDid(crypto).serialize();
      expect(did1).toEqual(did2);
      const services = {
          id: "service1Id",
          type: "service1Type",
          serviceEndpoint: "http://www.service1.com"
        }
      did2 = await new LongFormDid(crypto, [services]).serialize();
      expect(did1).not.toEqual(did2);
  });
});