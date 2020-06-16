import { CryptoBuilder, LongFormDid, ManagedHttpResolver } from '../lib/index';

describe('LongFormDid', () => {
  it('should generate a long form did', async () => {
    const did = 'did:test:12345678';
    const signingKeyReference = 'sign';
    let crypto = new CryptoBuilder(did, signingKeyReference)
      .build();

    const longFormDid = new LongFormDid(crypto);
    const longForm = await longFormDid.create(signingKeyReference);
    console.log(longForm);

    const resolver = new ManagedHttpResolver('https://portableidentitycards.azure-api.net');
    const didDocument: any = await resolver.resolve(longForm);
    expect(didDocument.didDocument).toBeDefined();
    console.log(didDocument);
  });
});