/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType, IExpected, ITokenValidator, ClaimToken } from '../index';
import { IValidationResponse } from '../InputValidation/IValidationResponse';
import ValidationOptions from '../Options/ValidationOptions';
import IValidatorOptions from '../Options/IValidatorOptions';
import { SelfIssuedValidation } from '../InputValidation/SelfIssuedValidation';
import ValidationQueue from '../InputValidation/ValidationQueue';
import ValidationQueueItem from '../InputValidation/ValidationQueueItem';

/**
 * Class to validate a token
 */
export default class SelfIssuedTokenValidator implements ITokenValidator {

  /**
   * Create new instance of <see @class SelfIssuedTokenValidator>
   * @param validatorOption The options used during validation
   * @param expected values to find in the token to validate
   */
  constructor (private validatorOption: IValidatorOptions, private expected: IExpected) {
  }


  /**
   * Validate the token
   * @param queue with tokens to validate
   * @param queueItem under validation
   */
  public async validate(_queue: ValidationQueue, queueItem:ValidationQueueItem): Promise<IValidationResponse> { 
    const options = new ValidationOptions(this.validatorOption, TokenType.selfIssued);
    const validator = new SelfIssuedValidation(options, this.expected);
    const validationResult = await validator.validate(queueItem.token);
    return validationResult as IValidationResponse;    
  }
  
  /**
   * Gets the type of token to validate
   */
  public get isType(): TokenType {
    return TokenType.selfIssued;
  }
}

