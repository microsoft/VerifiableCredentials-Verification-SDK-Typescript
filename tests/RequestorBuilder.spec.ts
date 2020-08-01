import IRequestor from '../lib/ApiOidcRequest/IRequestor';
import { Crypto, IssuanceAttestationsModel, SelfIssuedAttestationModel, VerifiablePresentationAttestationModel, TrustedIssuerModel, InputClaimModel, IdTokenAttestationModel, CryptoBuilder, RequestorBuilder, IResponse, Requestor } from '../lib/index';
import LongFormDid from '../lib/ApiCrypto/LongFormDid';

describe('RequestorBuilder', () => {
  const getAttestations = () => {
    const attestations: IssuanceAttestationsModel = new IssuanceAttestationsModel(
      new SelfIssuedAttestationModel(
        {
          alias: new InputClaimModel('name', 'string', false, true)
        },
        false,
        undefined,
        true
      ),
      [
        new VerifiablePresentationAttestationModel(
          'CredentialType',
          [
            new TrustedIssuerModel('trusted issuer 1'),
            new TrustedIssuerModel('trusted issuer 2')
          ],
          [
            new TrustedIssuerModel('endorser')
          ],
          [
            'contract'
          ],
          {
            givenName: new InputClaimModel('vc.credentialSubject.givenName'),
            familyName: new InputClaimModel('vc.credentialSubject.familyName', 'string', true)
          },
        ),
      ],
      [
        new IdTokenAttestationModel(
          'oidc config endpoint',
          'clientId',
          'redirect',
          'scope',
          {
            email: new InputClaimModel('upn', 'string', false, true),
            name: new InputClaimModel('name')
          }
        )
      ]);
    return attestations;
  }

  const did = 'did:test:12345678';
  const signingKeyReference = 'sign';
  let crypto = new CryptoBuilder(did, signingKeyReference)
    .build();

  const generateKey = async (keyReference: string, crypto: Crypto): Promise<string> => {
    const longFormDid = new LongFormDid(crypto);
    const longForm = await longFormDid.create(keyReference);
    console.log(`Long-form DID: ${longForm}`);
    return longForm;
  };

  const initializer: IRequestor = {
    crypto,
    clientName: 'My relying party',
    clientPurpose: 'Get access to my website',
    clientId: 'https://example.com/',
    redirectUri: 'https://example.com/login',
    tosUri: 'https://example.com/tos',
    logoUri: 'https://example.com/mylogo.png',
    attestation: getAttestations()
  };

  it('should build RequestorBuilder', () => {
    const builder = new RequestorBuilder(initializer);
    expect(builder.crypto).toEqual(crypto);
    expect(builder.attestation).toEqual(getAttestations());
    expect(builder.clientId).toEqual(initializer.clientId);
    expect(builder.clientName).toEqual(initializer.clientName);
    expect(builder.clientPurpose).toEqual(initializer.clientPurpose);
    expect(builder.logoUri).toEqual(initializer.logoUri);
    expect(builder.redirectUri).toEqual(initializer.redirectUri);
    expect(builder.tosUri).toEqual(initializer.tosUri);
    expect(builder.nonce).toBeUndefined();
    expect(builder.state).toBeUndefined();
    expect(builder.verifiablePresentationExpiry).toBeUndefined();

    // Add optional props
    builder.useNonce('nonce');
    expect(builder.nonce).toEqual('nonce');
    builder.useState('state');
    expect(builder.state).toEqual('state');
    builder.useVerifiablePresentationExpiry(-1);
    expect(builder.verifiablePresentationExpiry).toEqual(-1);
  });

  it('should sign the request', async () => {
    console.log('Create signed request');
    crypto.builder.did =await generateKey(signingKeyReference, crypto);

    let requestorBuilder = new RequestorBuilder(initializer)
      .useNonce('nonce')
      .useState('state')
      .useVerifiablePresentationExpiry(10);
    let requestor = requestorBuilder.build();

    let result: any = await requestor.create();
    expect(result.result).toBeTruthy();
    expect(requestor.payload.prompt).toBeUndefined();
    expect(result.request.split('.').length).toEqual(3);
    console.log(`Signed request: ${result.request}`);

    requestor = requestorBuilder.allowIssuance(false).build();
    result = requestor.create();
    expect(requestor.payload.prompt).toBeUndefined();

    requestor = requestorBuilder.allowIssuance(true).build();
    result = requestor.create();
    expect(requestor.payload.prompt).toEqual('create');

  });
});