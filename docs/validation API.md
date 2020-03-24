# Validation API
This document is a proposal for the validation API. The validation API is one of the major parts of the 
Relying party SDK.

We use the builder design pattern for the API. This allow us to feed in different options into the validation API.
For MVP the first example is needed. The other examples can be supported by the current architecture.

## Example: Validate a SIOP request

// Create a validator with a custom resolver.
const validator = await new ValidationBuilder()
                    .useDidResolvers(resolvers)
                    .continueAfterFailingValidation() // not MVP
                    .build();
const validationResult = validator.validate(siop: string, expectedAudience: string, expectedIssuer: string);

console.log(`Result: ${validationResult.ok}`);
console.log(`VCs: ${JSON.stringify(validationResult.claims.vcs)}`);
console.log(`Id Tokens: ${JSON.stringify(validationResult.claims.idTokens)}`);
console.log(`Self issued: ${JSON.stringify(validationResult.claims.selfIssued)}`);
console.log(`VCs: ${validationResult.claims.vcs[0].ok}`);
console.log(`VCs: ${validationResult.claims.vcs[0].detailedError}`);
console.log(`VCs claims: ${JSON.stringify(validationResult.claims.vcs[0].vc)}`);

## Example: Validate a Verifiable Credential

const vcValidator = await new ValidationBuilder()
                    .inputIs(TokenType.verifiableCredential)
                    .build();
const validationResult = validator.validate(vc: string, expectedAudience: string, expectedIssuers: string[]);


## Example: Validate a Verifiable Presentation

const vpValidator = await new ValidationBuilder()
                    .inputIs(TokenType.verifiablePresentation)
                    .build();
const validationResult = validator.validate(vp: string, expectedAudience: string, expectedIssuer: string);


## Example: Validate an id token

const idTokenValidator = await new ValidationBuilder()
                    .inputIs(TokenType.idToken)
                    .build();
const validationResult = validator.validate(idToken: string, expectedAudience: string, expectedIssuers: string[]);


## Example: Validate a SIOP request with custom id token validator

const idTokenValidator = await new ValidationBuilder()
                    .inputIs(TokenType.idToken)
                    .build();
const validationResult = validator.validate(idToken: string, expectedAudience: string, expectedIssuers: string[]);

const validator = await new ValidationBuilder()
                    .useValidators([idTokenValidator])
                    .build();
const validationResult = validator.validate(siop: string, expectedAudience: string, expectedIssuer: string);


