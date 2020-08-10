/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType, IExpectedSiop, ITokenValidator } from '../index';
import { IValidationResponse } from '../input_validation/IValidationResponse';
import ValidationOptions from '../options/ValidationOptions';
import IValidatorOptions from '../options/IValidatorOptions';
import ValidationQueue from '../input_validation/ValidationQueue';
import ValidationQueueItem from '../input_validation/ValidationQueueItem';
import { SiopValidation } from '../input_validation/SiopValidation';

/**
 * Class to validate a token
 */
export default class SiopTokenValidator implements ITokenValidator {

  /**
   * Create new instance of <see @class SiopTokenValidator>
   * @param validatorOption The options used during validation
   * @param expected values to find in the token to validate
   */
  constructor (private validatorOption: IValidatorOptions, private expected: IExpectedSiop) {
  }

 /**
   * Validate the token
   * @param queue with tokens to validate
   * @param queueItem under validation
   */
  public async validate(queue: ValidationQueue, queueItem: ValidationQueueItem): Promise<IValidationResponse> { 
    const options = new ValidationOptions(this.validatorOption, this.expected.type);
    const validator = new SiopValidation(options, this.expected);
    const validationResult = await validator.validate(queueItem.tokenToValidate);
    if (validationResult.tokensToValidate) {
      for (let key in validationResult.tokensToValidate) {
        queue.enqueueItem(new ValidationQueueItem(key, validationResult.tokensToValidate[key].rawToken, validationResult.tokensToValidate[key]));
      }
    }
    return validationResult as IValidationResponse;
  }
  
  
  /**
   * Gets the type of token to validate
   */
  public get isType(): TokenType {
    return this.expected.type;
  }
}

