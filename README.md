
# Sample Validation API
    const siop = 'put your siop here';

    // Create all validators to validate a full SIOP
    let tokenValidatorsBuilder = new TokenValidatorsBuilder()
    // Check if the VCs in the SIOP are from the trust issuers
    .useTrustedIssuersForVerifiableCredentials([
      {
        credentialType: 'driverslicense',
        issuers: ['did:test:issuer1', 'did:test:issuer2']
      }
    ])

    // Check if the id tokens in the SIOP are from the trust issuers
    .useTrustedIssuersForIdTokens([
      {
        credentialType: 'driverslicense',
        configuration: ['https://example.org/.well-known/openid']
      }
    ])
    // Use when one wants to validate that SIOP was presented to the relying party (audience). Optional.
    .useAudience('https://example.org', 'did:test:12345678');
          
    // The constructor can be create once for a specific a specific token type.
    let validator = new ValidatorBuilder()
    .useValidators(tokenValidatorsBuilder.build())
    .build();

    const validation = await validator.validate(siop);
    if (validation.result) {
      // Show decoded tokens
      console.log(`Id Token ${JSON.stringify(validation.validationResult.idToken[0])}`);
      console.log(`VC ${JSON.stringify(validation.validationResult.verifiableCredentials[0])}`);
    } else {
      console.log(`validation error: ${validation.detailedError`});
    }

# Sample data for OIDC Request

    // common method to get an attestations object
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
          {
            email: new InputClaimModel('upn', 'string', false, true),
            name: new InputClaimModel('name')
          }
        )
      ]);
    return attestations;  
    }

# Sample create OIDC Request with crypto on the server

    // Return crypto object for crypto on server operations
    const getCryptoOnServer = async (did: string, keyReference: string) => {
      const cryptoBuilder = new CryptoBuilder(did);
      const crypto = cryptoBuilder.build();

      // See https://github.com/diafygi/webcrypto-examples for examples how to use the W3C web Crypto stamdard
      // Generate a key
      const key = await crypto.builder.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'secp256k1',
        },
        true, //whether the key is extractable (i.e. can be used in exportKey)
        ['sign', 'verify'] //can be any combination of 'sign' and 'verify'
      );
      const jwk: any = await crypto.builder.subtle.exportKey(
        "jwk",
        key //can be a publicKey or privateKey, as long as extractable was true
      );

      // Store key
      await crypto.builder.keyStore.save(keyReference, jwk);
      return crypto;
    };

    // Create crypto running on server
    const did = 'the relying party DID';
    const keyReference = 'myKey';

    // Generate key and get crypto object
    const crypto: Crypto = await getCryptoOnServer(did, keyReference);

    // Get the required attestations. Tell the App which claims to expect
    const attestations = getAttestations();

    // OIDC request
    const state = 'state to pass to App';
    const nonce = 'nonce to pass to App'
    // The constructure takes argument which are static for a specific request type
    const requestorBuilder = new RequestorBuilder(
      crypto,
      'Contoso - My Relying Party name',
      ['Accessing Contoso'],
      'https://www.contoso.com/',
      'https://www.contoso.com/login',
      'did:test:12345678',
      ['https://www.contoso.com/tos'],
      ['https://www.contoso.com/contoso.ico'],
      attestations
    )
    // Add state which will be returned by the App
    .useState(state)
    // Add nonce to avoid replay attack
    .useNonce(nonce);

    // Build the requestor
    const requestor = requestorBuilder.build();
    const request = requestor.create(keyReference)
    const serializedRequest = JSON.stringify(request);
    console.log(serializedRequest);

# Sample create OIDC Request with crypto on Key Vault
  // Return crypto object for crypto on key vault
  const getCryptoOnKeyVault = async (did: string, keyReference: string) => {
    const cryptoBuilder = new CryptoBuilder(did)
      .useKeyVault(
        'tenantGuid',
        'kvClientId',
        'kvClientSecret',
        'keyVaultUri');

    const crypto = cryptoBuilder.build();

    // See https://github.com/diafygi/webcrypto-examples for examples how to use the W3C web Crypto stamdard
    // Generate a key
    const key = await crypto.builder.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'secp256k1',
      },
      true, //whether the key is extractable (i.e. can be used in exportKey)
      ['sign', 'verify'] //can be any combination of 'sign' and 'verify'
    );
    const jwk: any = await crypto.builder.subtle.exportKey(
      "jwk",
      key //can be a publicKey or privateKey, as long as extractable was true
    );

    // Store key
    await crypto.builder.keyStore.save(keyReference, jwk);
    return crypto;
  };

    // Create crypto running in Key Vault
    const did = 'the relying party DID';

    // Generate key and get crypto object
    const keyReference = 'myKey';
    const crypto: Crypto = await getCryptoOnKeyVault(did, keyReference);

    // Get the required attestations. Tell the App which claims to expect
    const attestations = getAttestations();

    // OIDC request
    const state = 'state to pass to App';
    const nonce = 'nonce to pass to App'
    // The constructure takes argument which are static for a specific request type
    const requestorBuilder = new RequestorBuilder(
      crypto,
      'Contoso - My Relying Party name',
      ['Accessing Contoso'],
      'https://www.contoso.com/',
      'https://www.contoso.com/login',
      'did:test:12345678',
      ['https://www.contoso.com/tos'],
      ['https://www.contoso.com/contoso.ico'],
      attestations
    )
    // Add state which will be returned by the App
    .useState(state)
    // Add nonce to avoid replay attack
    .useNonce(nonce);

    // Build the requestor
    const requestor = requestorBuilder.build();
    const request = requestor.create(keyReference)
    const serializedRequest = JSON.stringify(request);
    console.log(serializedRequest);


# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
