# version 0.12.1-preview.19
## Siop Validation refinements
**Type of change:** Feature
**Customer impact:** medium
- Add a flag to RulesContent signaling whether or not it contains input attestations
- Allow callers to specify tokensToValidate

# version 0.12.1-preview.17
## Complete Siop Validation
**Type of change:** bug fix
**Customer impact:** high
- Full Siop Id Token Validation

# version 0.12.1-preview.16
## Allow pre-validation of a siop token for issuance
**Type of change:** bug fix
**Customer impact:** low
- Allow for a siop token to be validated before calling Validator.validate

# version 0.12.1-preview.15
## JSONPath vulnerability fix
**Type of change:** bug fix
**Customer impact:** low
- Fix high severity code injection vulnerability via JSONPath.

# version 0.12.1-preview.14
## IdToken Validation improvements
**Type of change:** bug fix
**Customer impact:** medium
- Enforce configuration endpoint in input IdToken attestations to match an expected IdToken configuration endpoint i.e., don't rely solely on signature to match an IdToken.
- No longer iterate over all IdToken to find a match by signature. Only validate the signature of
the IdToken with the matching configuration endpoint. 

# version 0.12.1-preview.12
## When a Verifiable Presentation is invalid, return IValidatorOptions.invalidTokenError
**Type of change:** feature work
**Customer impact:** low
- Use IValidatorOptions.invalidTokenError for the response to a invalid VP

# version 0.12.1-preview.9
## When a VP/VC has been revoked, return IValidatorOptions.invalidTokenError
**Type of change:** feature work
**Customer impact:** low
- Use IValidatorOptions.invalidTokenError for the response to a revoked VC

# version 0.12.1-preview.8
## Performance improvements for ClaimToken.Create
**Type of change:** feature work
**Customer impact:** medium
- Allow customizable status code for token validation errors
- Default behavior is that invalid tokens result in 401

# version 0.12.1-preview.7
## Performance improvements for ClaimToken.Create
**Type of change:** feature work
**Customer impact:** low
- Don't parse a jwt multiple times

## Add Validation safeguards
**Type of change:** feature work
**Customer impact:** low

# version 0.12.1-preview.6
## Attack vector protection IdToken Hint
**Type of change:** feature work
**Customer impact:** low
- Protection against attack vector.

A new class ValidationSafeguards is added. The safeguards can be set via the ValidationBuilder.
Several new properties are added to the builder.

  /**
   * Gets the maximum number of VC tokens in a SIOP presentation
   */
  public get maxNumberOfVCTokensInPresentation()

  /**
   * Sets the maximum number of VC tokens in a SIOP presentation
   */
  public useMaxNumberOfVCTokensInPresentation(value: number): ValidatorBuilder 

  /**
   * Gets the maximum size of VP tokens in a SIOP
   */
  public get maxSizeOfVPTokensInSiop()

  /**
   * Sets the maximum size of VP tokens in a SIOP
   */
  public useMaxSizeOfVPTokensInSiop(value: number): ValidatorBuilder 

  /**
   * Gets the maximum size of VC tokens in a presentation
   */
  public get maxSizeOfVCTokensInPresentation() 

  /**
   * Sets the maximum size of VC tokens in a presentation
   */
  public useMaxSizeOfVCTokensInPresentation(value: number): ValidatorBuilder 

  /**
   * Gets the maximum size of ID tokens
   */
  public get maxSizeOfIdToken() 

  /**
   * Sets the maximum size of ID tokens
   */
  public useMaxSizeOfIdToken(value: number): ValidatorBuilder 



# version 0.12.1-preview.5
## Support IdToken Hint Tokens
**Type of change:** feature work
**Customer impact:** low
- DIDs for TrustedIssuerModel instances need to be strings.

# version 0.12.1-preview.4
## Support IdToken Hint Tokens
**Type of change:** feature work
**Customer impact:** low
- Allow SiopValidation and SiopTokenValidator to be extended by making some of its methods protected.
- Make TrustedIssuerModel validation stricter by enforcing valid issuer DIDs.

# version 0.12.1-preview.3
## Support IdToken Hint Tokens
**Type of change:** feature work
**Customer impact:** low
- Add new TokenType for IdToken Hints.
- Augment IdTokenAttestationModel with optional trusted issuers.

# version 0.12.1-preview.2
## Add error codes to the validation response
**Type of change:** engineering    
**Customer impact:** low
The validation response return code, a string which contains a unique value for the error.
The error code is fixed in unit tests

    console.log(validationResponse.code); // for seeing the code
    console.log(validationResponse.status); // for seeing the suggested status to return to client
    console.log(validationResponse.detailedError); // for seeing the detailed error message


# version 0.12.1-preview.1
## Pass fetchRequest to resolver to enable customization of fetch for resolver
**Type of change:** bug fix
**Customer impact:** low


## Allow IValidationOptions to be specified via ValidatorBuilder
**Type of change:** feature    
**Customer impact:** low

Removed IHttpClientOptions because it is not used anymore.

VerifiablePresentationTokenValidator ctor no longer uses the crypto argument.

Add validationOptions property to ValidatorBuilder

    // Retrieve the validator options from the builder state
    const options = validationBuilder.validationOptions;  


# version 0.11.1
## Turn 0.11.1-preview.5 into the released package


# version 0.11.1-preview.5
## Change default resolver to beta resolver
**Type of change:** engineering    
**Customer impact:** low

## Update unit tests
**Type of change:** engineering    
**Customer impact:** low

## Remove httpClient from BasicValidatorOptions
**Type of change:** engineering    
**Customer impact:** medium

Could lead to build errors. Just remove the httpClient. It is not used by the SDK.

## Support IFetchRequest client
**Type of change:** new feature/breaking change
**Customer impact:** low

Introducing new interface IFetchRequest which allows an application to provide its own correlation id's and a fetch client which can be handling metrics, caching and logging.


Breaking change
The interface IValidatorOptions is extended with a new IFetchRequest property. Just add:

      fetchRequest: new FetchRequest()
      
# version 0.11.1-preview.4
## Fix token exp check not defined
**Type of change:** bug    
**Customer impact:** low


# version 0.11.1-preview.3
## Update to ion v1
**Type of change:** engineering    
**Customer impact:** high

This is a breaking change. Long form did's previously generated should be regenerated.
The crypto object now requires an update key.
Add
            crypto = await crypto.generateKey(KeyUse.Signature, 'update');
            
Add the following line to the builder to register the update key            
            builder.useUpdateKeyReference(updateKeyReference)


## Add silent mode
**Type of change:** engineering    
**Customer impact:** low

console.log message are removed

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




