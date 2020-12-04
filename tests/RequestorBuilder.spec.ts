import IRequestorAttestation from '../lib/api_oidc_request/IRequestorAttestation';
import { LongFormDid, KeyReference, KeyUse, Crypto, IssuanceAttestationsModel, SelfIssuedAttestationModel, VerifiablePresentationAttestationModel, TrustedIssuerModel, InputClaimModel, IdTokenAttestationModel, CryptoBuilder, RequestorBuilder, IResponse, Requestor } from '../lib/index';
import { CorrelationVector } from '../lib/tracing/CorrelationVector';

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
          6 * 60,
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
  const signingKeyReference = new KeyReference('sign');
  let crypto = new CryptoBuilder()
    .useDid(did)
    .useSigningKeyReference(signingKeyReference)
    .build();

  const generateKey = async (keyReference: KeyReference, crypto: Crypto): Promise<string> => {

    crypto.builder.useSigningKeyReference(keyReference);
    crypto.builder.useRecoveryKeyReference(new KeyReference('recovery'));
    crypto = await crypto.generateKey(KeyUse.Signature);
    crypto = await crypto.generateKey(KeyUse.Signature, 'recovery');

    const longFormDid = await new LongFormDid(crypto).serialize();
    console.log(`Long-form DID: ${longFormDid}`);
    return longFormDid;
  };

  const initializer: IRequestorAttestation = {
    clientName: 'My relying party',
    clientPurpose: 'Get access to my website',
    clientId: 'https://example.com/',
    redirectUri: 'https://example.com/login',
    tosUri: 'https://example.com/tos',
    logoUri: 'https://example.com/mylogo.png',
    attestations: getAttestations()
  };

  fit('should add the correlation vector', () => {
    let builder = new RequestorBuilder(initializer, crypto)
      .useCorrelationVector('AABBCCDDEEFF');
      expect(builder.correlationVector).toEqual('AABBCCDDEEFF.0');

    let correlationVector = CorrelationVector.createCorrelationVector();
    console.log(correlationVector.value);
    correlationVector.increment();
    console.log(correlationVector.value);
    correlationVector = CorrelationVector.extend(correlationVector.value);
    console.log(correlationVector.value);
    correlationVector = CorrelationVector.parse('AABBCCDDEEFF.0');
    expect(correlationVector.value).toEqual('AABBCCDDEEFF.0');
  });

  it('should build RequestorBuilder', () => {
    const builder = new RequestorBuilder(initializer, crypto);
    expect(builder.crypto).toEqual(crypto);
    expect((<IRequestorAttestation>builder.requestor).attestations).toEqual(getAttestations());
    expect(builder.clientId).toEqual(initializer.clientId);
    expect(builder.clientName).toEqual(initializer.clientName);
    expect(builder.clientPurpose).toEqual(initializer.clientPurpose);
    expect(builder.logoUri).toEqual(initializer.logoUri);
    expect(builder.redirectUri).toEqual(initializer.redirectUri);
    expect(builder.tosUri).toEqual(initializer.tosUri);
    expect(builder.nonce).toBeUndefined();
    expect(builder.state).toBeUndefined();

    // Add optional props
    builder.useNonce('nonce');
    expect(builder.nonce).toEqual('nonce');
    builder.useState('state');
    expect(builder.state).toEqual('state');
    builder.useOidcRequestExpiry(60 * 60);
    expect(builder.OidcRequestExpiry).toEqual(60 * 60);

  });

  it('should sign the request', async () => {
    console.log('Create signed request');
    const did = await generateKey(signingKeyReference, crypto)
    crypto.builder.useDid(did);

    let requestorBuilder = new RequestorBuilder(initializer, crypto)
      .useNonce('nonce')
      .useState('state')
      .useOidcRequestExpiry(100);
    let requestor = requestorBuilder.build();

    let result: any = await requestor.create();

    expect(result.result).toBeTruthy();

    expect(requestor.payload.attestations.presentations[0].validityInterval).toEqual(360);
    const iat = requestor.payload.iat;
    expect(requestor.payload.exp).toEqual(iat + 100);

    expect(requestor.payload.prompt).toBeUndefined();
    expect(result.request.split('.').length).toEqual(3);
    console.log(`Signed request: ${result.request}`);

    requestor = requestorBuilder.build();
    result = requestor.create();
    expect(requestor.payload.prompt).toBeUndefined();
    expect(requestor.builder.issuance).toBeFalsy();

    requestor = requestorBuilder.allowIssuance().build();
    result = requestor.create();
    expect(requestor.payload.prompt).toEqual('create');
    expect(requestor.builder.issuance).toBeTruthy();

  });
});