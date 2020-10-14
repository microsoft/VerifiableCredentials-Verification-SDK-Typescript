/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType, IExpectedIdToken, ITokenValidator, ClaimToken } from '../index';
import { IValidationResponse } from '../input_validation/IValidationResponse';
import ValidationOptions from '../options/ValidationOptions';
import IValidatorOptions from '../options/IValidatorOptions';
import { IdTokenValidation } from '../input_validation/IdTokenValidation';
import ValidationQueue from '../input_validation/ValidationQueue';
import ValidationQueueItem from '../input_validation/ValidationQueueItem';

/**
 * Class to validate a token
 */
export default class IdTokenTokenValidator implements ITokenValidator {

  /**
   * Create new instance of <see @class IdTokenTokenValidator>
   * @param validatorOption The options used during validation
   * @param expected values to find in the token to validate
   */
  constructor (private validatorOption: IValidatorOptions, private expected: IExpectedIdToken) {
  }


  /**
   * Validate the token
   * @param queue with tokens to validate
   * @param queueItem under validation
   * @param siopDid Some validators wil check if the siop DID corresponds with their audience
   * @param siopContract Conract type asked during siop
   */
  public async validate(_queue: ValidationQueue, queueItem:ValidationQueueItem, _siopDid: string, siopContract: string): Promise<IValidationResponse> { 
    const options = new ValidationOptions(this.validatorOption, TokenType.idToken);
    const validator = new IdTokenValidation(options, this.expected, siopContract);
    const validationResult = await validator.validate(queueItem.tokenToValidate.rawToken);
    return validationResult as IValidationResponse;    
  }

  /**
   * Get tokens from current item and add them to the queue.
   * @param validationResponse The response for the requestor
   * @param queue with tokens to validate
   */
  public getTokens(_validationResponse: IValidationResponse, _queue: ValidationQueue ): IValidationResponse {
    throw new Error('Not implemented');
  }

  /**
   * Gets the type of token to validate
   */
  public get isType(): TokenType {
    return TokenType.idToken;
  }
}

