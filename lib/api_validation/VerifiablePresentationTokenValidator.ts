/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType, IExpectedVerifiablePresentation, ITokenValidator, ClaimToken } from '../index';
import { IValidationResponse } from '../input_validation/IValidationResponse';
import ValidationOptions from '../options/ValidationOptions';
import { VerifiablePresentationValidation } from '../input_validation/VerifiablePresentationValidation';
import IValidatorOptions from '../options/IValidatorOptions';
import ValidationQueue from '../input_validation/ValidationQueue';
import ValidationQueueItem from '../input_validation/ValidationQueueItem';
import { Crypto } from '../index';

/**
 * Class to validate a token
 */
export default class VerifiablePresentationTokenValidator implements ITokenValidator {

  /**
   * Create new instance of <see @class VerifiablePresentationTokenValidator>
   * @param validatorOption The options used during validation
   * @param expected values to find in the token to validate
   */
  constructor (private validatorOption: IValidatorOptions, private crypto: Crypto, private expected: IExpectedVerifiablePresentation ) {
  }

  /**
   * Validate the token
   * @param queue with tokens to validate
   * @param queueItem under validation
   * @param siopDid needs to be equal to audience of VP
   */
  public async validate(queue: ValidationQueue, queueItem: ValidationQueueItem, siopDid: string): Promise<IValidationResponse> { 
    const options = new ValidationOptions(this.validatorOption, TokenType.verifiablePresentation);
    const validator = new VerifiablePresentationValidation(options, this.expected, siopDid, queueItem.id, this.crypto);
    const validationResult = await validator.validate(queueItem.tokenToValidate);

    if (validationResult.tokensToValidate) {
      for (let key in validationResult.tokensToValidate) {
        queue.enqueueToken(key, validationResult.tokensToValidate[key].rawToken);
      }
    }
    return validationResult;
  }
  
  /**
   * Gets the type of token to validate
   */
  public get isType(): TokenType {
    return TokenType.verifiablePresentation;
  }
}

