/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType, IExpectedSiop, ITokenValidator, ClaimToken } from '../index';
import { IValidationResponse } from '../input_validation/IValidationResponse';
import ValidationOptions from '../options/ValidationOptions';
import IValidatorOptions from '../options/IValidatorOptions';
import ValidationQueue from '../input_validation/ValidationQueue';
import ValidationQueueItem from '../input_validation/ValidationQueueItem';
import { SiopValidation } from '../input_validation/SiopValidation';
import VerifiableCredentialConstants from '../verifiable_credential/VerifiableCredentialConstants';
import ErrorHelpers from '../error_handling/ErrorHelpers';
const errorCode = (error: number) => ErrorHelpers.errorCode('VCSDKSTVa', error);

/**
 * Class to validate a token
 */
export default class SiopTokenValidator implements ITokenValidator {

  /**
   * Create new instance of <see @class SiopTokenValidator>
   * @param validatorOption The options used during validation
   * @param expected values to find in the token to validate
   */
  constructor(private validatorOption: IValidatorOptions, private expected: IExpectedSiop) {
  }

  /**
    * Validate the token
    * @param queue with tokens to validate
    * @param queueItem under validation
    */
  public async validate(queue: ValidationQueue, queueItem: ValidationQueueItem): Promise<IValidationResponse> {
    const options = new ValidationOptions(this.validatorOption, this.expected.type);
    const validator = new SiopValidation(options, this.expected);
    let validationResult = await validator.validate(<string>queueItem.tokenToValidate.rawToken);
    if (validationResult.result) {
      validationResult = this.getTokens(validationResult, queue);
    }

    validationResult = this.validateReplayProtection(validationResult);
    return validationResult as IValidationResponse;
  }

  /**
   * Check state and nonce
   * @param validationResponse The response for the requestor
   */
  private validateReplayProtection(validationResponse: IValidationResponse): IValidationResponse {
    if (this.expected.nonce) {
      if (this.expected.nonce !== validationResponse.payloadObject.nonce) {
        return {
          result: false,
          status: 403,
          code: errorCode(1),
          detailedError: `Expected nonce '${this.expected.nonce}' does not match '${validationResponse.payloadObject.nonce}'.`
        }
      }
    }
    if (this.expected.state) {
      if (this.expected.state !== validationResponse.payloadObject.state) {
        return {
          result: false,
          status: 403,
          code: errorCode(2),
          detailedError: `Expected state '${this.expected.state}' does not match '${validationResponse.payloadObject.state}'.`
        }
      }
    }

    return validationResponse;
  }

  /**
   * Get tokens from current item and add them to the queue.
   * @param validationResponse The response for the requestor
   * @param queue with tokens to validate
   */
  public getTokens(validationResponse: IValidationResponse, queue: ValidationQueue): IValidationResponse {

    // Check type of SIOP
    let type: TokenType;
    if (validationResponse.payloadObject[VerifiableCredentialConstants.ATTESTATIONS]) {
      type = TokenType.siopPresentationAttestation;
    } else if (validationResponse.payloadObject[VerifiableCredentialConstants.PRESENTATION_SUBMISSION]) {
      type = TokenType.siopPresentationExchange;
    } else {
      type = TokenType.siop;
    }
    switch (type) {
      case TokenType.siopPresentationAttestation:
        const attestations = validationResponse.payloadObject[VerifiableCredentialConstants.ATTESTATIONS];
        if (attestations) {
          // Decode tokens
          try {
            validationResponse.tokensToValidate = ClaimToken.getClaimTokensFromAttestations(attestations);
          } catch (err) {
            console.error(err);
            return {
              result: false,
              status: 400,
              detailedError: err.message,
              code: errorCode(3),
              innerError: err
            };
          }
        }
        break;

      case TokenType.siopPresentationExchange:
        // Get presentation exchange tokens

        // Decode tokens
        try {
          validationResponse.tokensToValidate = ClaimToken.getClaimTokensFromPresentationExchange(validationResponse.payloadObject);
        } catch (err) {
          console.error(err);
          return {
            result: false,
            status: 403,
            detailedError: err.message,
            code: errorCode(4),
            innerError: err
        };
        }
        break;

      default:
          return {
            result: false,
            status: 400,
            detailedError: 'Not a valid SIOP',
            code: errorCode(5)
        };
    }
    if (validationResponse.tokensToValidate) {
      for (let key in validationResponse.tokensToValidate) {
        queue.enqueueItem(new ValidationQueueItem(key, validationResponse.tokensToValidate[key]));
      }
    }
    return validationResponse;
  }

  /**
   * Gets the type of token to validate
   */
  public get isType(): TokenType {
    return this.expected.type;
  }
}

