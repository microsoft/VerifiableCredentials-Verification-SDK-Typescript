# version 0.11.1-preview.3
## Support correlation vectors and IFetchRequest client
**Type of change:** new feature/breaking change    
**Customer impact:** low

Integrate correlation vectors into the Requestor/Validator objects and use them for additional legs in the transactions

      requestor.useCorrelationId("AABBCCDDEEFF.0")
      validator.useCorrelationId("AABBCCDDEEFF.0")

If the correlation id is not specified by the calling App, the SDK will generate its own correlation id for the transaction. The correlation id will be updated for each call out.

Introducing new interface IFetchRequest which allows an application to provide its own correlation id's and a fetch client which can be handling metrics, caching and logging.


Breaking change
The interface IValidatorOptions is extended with a new IFetchRequest property. Just add:

      fetchRequest: new FetchRequest('correlation id')

# version 0.11.1-preview.1
## Refactored OpenId public key fetching to allow for caching
**Type of change:** engineering    
**Customer impact:** low

# version 0.11.1-preview.0
## Rules Model updates to support extensiblity features
**Type of change:** new feature    
**Customer impact:** low

# version 0.10.1
## Support for json-ld proofs
**Type of change:** new feature    
**Customer impact:** low

Creation of json-ld proofs is supported.
By default Jose signatures will be in the JWT format.

Add useJsonLdProofsProtocol to the JoseBuilder to support json-ld proofs:

          let jsonLdProofBuilder = new JoseBuilder(crypto)
            .useJsonLdProofsProtocol('JcsEd25519Signature2020')

For the moment only the JcsEd25519Signature2020 cipher suite is supported. See https://identity.foundation/JcsEd25519Signature2020/

## Improved performance of the Key Vault plugin
**Type of change:** engineering    
**Customer impact:** low

Additional caching improves the performance of the Key Vault operations.

## OIDC request should have id_token as response_type instead of idtoken
**Type of change:** bug    
**Customer impact:** breaking change if customer relies on response_type

The wrong value was passed in ther response_type property of the OIDC request.


## Change the value of client_id to equal redirect_uri. So redirect_uri is enforced
**Type of change:** bug    
**Customer impact:** breaking change if customer relies on client_id

The client_id property of the OIDC request will always be equal to redirect_uri.


## Updated to verifiablecredentials-crypto-sdk-typescript v1.1.11
**Type of change:** engineering    
**Customer impact:** low

See change log here: https://github.com/microsoft/VerifiableCredentials-Crypto-SDK-Typescript/blob/master/CHANGE_LOG.md




