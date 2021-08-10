![GitHub package.json version](https://img.shields.io/github/package-json/v/microsoft/VerifiableCredentials-Verification-SDK-Typescript)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/microsoft/VerifiableCredentials-Verification-SDK-Typescript)


# GitHub Verification SDK

 

# Repo

[https://github.com/microsoft/VerifiableCredentials-Verification-SDK-Typescript](https://github.com/microsoft/VerifiableCredentials-Verification-SDK-Typescript)

 

# Goals

## Goal – Validate complex Self-Issued OpenID Connect (SIOP) requests

SIOPs can contain multiple id tokens such as verifiable credentials and presentations. The SDK defines easy methods to validate these complex payloads.

We can pass in expected values and these values are checked by the SDK during the validation process.

## Goal – Help services to create OpenID Connect requests

Support for creating signed OpenID Connect requests. The signing can be done on nodejs or on Key Vault.

## Goal – Service can decide to use Key Vault for key storage and crypto operations

Provide flexibility to services to use more secure environments such as Key Vault for critical cryptographic operations. The service can use configuration to switch between Key Vault or nodejs.

# Concepts

## Builder pattern

The top-level API is based on the [Builder pattern](https://en.wikipedia.org/wiki/Builder_pattern). The Builder pattern allows for different representation of complex classes. This is great to deal with a lot of different options. Our SDK must deal with a lot of options, hence the choice for the Builder pattern.

Practically each base class has a builder class. We use the following convention:

 for the base class.

Builder for the builder class.

The builder class use verbs to add options (e.g. useState, useNonce). The builder class’s purpose is managing the options and not to do actions. By calling the build() method, an instance of the base class is created.

The action methods are defined in the base class. The base class has access to the builder class for access to all properties.

The constructor of the builder class will use arguments which are fixed for the object so the constructor can be instantiated beforehand, in some initializer class.

 

## CryptoBuilder/Crypto

The Crypto class is necessary for the Requestor class. The Requestor needs to sign the request payload and requires cryptographic capabilities.

The creation of the Crypto base class is faily simple.

	    const crypto = new CryptoBuilder(did, signingKeyReference)
        .useDid(did)
        .useSigningKeyReference(signingKeyReference)
        .build();

### did 

The DID of the service  


### signingKeyReference

The reference that is used to publish the public key of the signing key in the DID document.

Services require flexibility where their security critical, cryptographic operations happen. The default is no secure environment.

The Crypto object supports Key Vault as a secure environment for the cryptographic operations.

      const crypto = new CryptoBuilder()
        .useKeyVault(credential, vaultUrl)
        .useDid(did)
        .useSigningKeyReference(signingKeyReference)
        .build();

### useKeyVault

The useKeyVault method informs the Crypto class that cryptographic operations need to happen on Key Vault.

‘credential’ allows to pass in different credential used to access Key Vault. One can pass in a client id and client secret but also an X.509 certificate.

‘vaultUrl’ specifies the bases url of the Key Vault environment to use.

## RequestorBuilder/Requestor

Services authenticate users by means of DIDs. The DID community created a protocol based on the Self Issued OpenID Connect provider protocol called [DID Auth](https://nbviewer.jupyter.org/github/WebOfTrustInfo/rwot8-barcelona/blob/master/final-documents/did-auth-oidc.pdf) based on a simple request/response transaction. The service needs to produce a signed request on which the user’s agent will respond with a response containing claims about the subject/user.

The Requestor class is designed to create DID Auth Requests and make the process of allowing users to authenticate by means of DIDs simpler.

      const requestor = new RequestorBuilder(request, crypto)
        .useNonce(nonce)
        .useState(state)  
        .build();

The constructor takes a JSON object which contains information about the service. There are three important areas in the request:

1. The Crypto object needed to allow the Requestor to sign the request.
2. Properties about the service such as its name, logo, etc.
3. An attestation sections which allows the service to state which claims are expected in the response.

In the example we also pass in the state and nonce properties intended to protect the transaction. In case one wants to instantiate the builder class beforehand, in some service initializer class, nonce and state can also be passed into the requestor create method.

The actual OpenID Connect request can be created by means of a simple call.

 const requestResult = await requestor.create();

## ValidatorBuilder/Validator

The Validator class validates id tokens. Tokens in the DID space can be very complex and the Validator class helps services to making the process of validating these tokens much simpler.

The Validator class validates five kind of tokens.

### Self-Issued token

A self-issued token is just a set of claims provided by the user in a JSON object. There is no validation done on the self-issued token.

### OpenID Connect id token

An OpenID Connect id token is issued by an OpenID Connect provider. This provider is represented by a [configuration URI](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig) usually referred to as the well-known URI. The configuration URIs of the trusted OpenID Connect providers need to be provided to the Validator to allow the Validator to validate the corresponding id token.

### Verifiable credentials and their corresponding presentations

[Verifiable credentials](https://www.w3.org/TR/vc-data-model/) are standardized by W3C.

Verifiable credentials are issued to the user by some trusted issuer. 

Verifiable presentations present a verifiable credential to some peer. A presentation can contain one or more verifiable credentials. A presentation is also a token.

### Self-Issued OpenID Connect (SIOP) 

The SIOP is the actual response signed by the DID of the client that is returned when the service does a SIOP request. The SIOP can contain any of the above tokens. 

           const validator = new ValidatorBuilder(this.crypto)
            .useTrustedIssuerConfigurationsForIdTokens(rules.attestations.idTokens.map((idTokenRule: any) => idTokenRule.configuration))
            .useAudienceUrl('https://test-relyingparty.azurewebsites.net/verify')
            .build();

          const validationResult = await validator.validate(siop);
          if (!validationResult.result) {
              console.error(`Validation failed: ${validationResult.detailedError}`);
              return validationResult;
          }

          return validationResult;

The example creates a Validator object by passing in two options.

__useTrustedIssuerConfigurationsForIdTokens__ provides an array of trusted well-know configuration URIs, needed by the validator to check id tokens.

__useAudienceUrl__ provides the URL of the service’s validation endpoint. This is used to check whether the SIOP was presented to the right endpoint.

The validate(siop) method does the actual validation.

# Getting started

## Install

To add the sdk to your package.json:

npm i verifiablecredentials-verification-sdk-typescript

## Cloning

Git clone verifiablecredentials-verification-sdk-typescript.git

### Update all packages

npm install

### Build

npm run build

### Test

npm run test  
 

# Publishing the package to npmjs

Only authorized publishers are allowed to publish the package.

## Test all unit tests

     npm run build
     npm run test

Make sure all tests pass.
Make sure no new uncovered lines are introduced.

## Update version

Make sure package.json shows the new version to publish.
Also CHANGE_LOG.md shows the changes done to the new version.


## publish

It is most common to publish a preview version.

    npm publish --tag preview


Skip the --tag to do a new release of the package. Remove '-preview.<n>' from the version number.
The release package is the same as the last preview package.


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

