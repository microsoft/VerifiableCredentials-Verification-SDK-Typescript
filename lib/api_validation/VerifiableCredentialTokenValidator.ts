/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import ErrorHelpers from '../error_handling/ErrorHelpers';
import { IExpectedVerifiableCredential, ITokenValidator, TokenType, ValidationError } from '../index';
import { IValidationResponse } from '../input_validation/IValidationResponse';
import ValidationQueue from '../input_validation/ValidationQueue';
import ValidationQueueItem from '../input_validation/ValidationQueueItem';
import { VerifiableCredentialValidation } from '../input_validation/VerifiableCredentialValidation';
import IValidatorOptions from '../options/IValidatorOptions';
import ValidationOptions from '../options/ValidationOptions';
const errorCode = (error: number) => ErrorHelpers.errorCode('VCSDKVCTV', error);

/**
 * Class to validate a token
 */
export default class VerifiableCredentialTokenValidator implements ITokenValidator {

  /**
   * Create new instance of <see @class VerifiableCredentialTokenValidator>
   * @param validatorOption The options used during validation
   * @param expected values to find in the token to validate
   */
  constructor(private validatorOption: IValidatorOptions, private expected: IExpectedVerifiableCredential) {
  }


  /**
   * Validate the token
   * @param queue with tokens to validate
   * @param queueItem under validation
   * @param siopDid needs to be equal to audience of VC
   */
  public async validate(_queue: ValidationQueue, queueItem: ValidationQueueItem, siopDid: string): Promise<IValidationResponse> {
    const options = new ValidationOptions(this.validatorOption, TokenType.verifiableCredential);

    if (typeof queueItem.tokenToValidate.rawToken === 'string') {
      const validator = new VerifiableCredentialValidation(options, this.expected);
      const validationResult = await validator.validate(<string>queueItem.tokenToValidate.rawToken, siopDid);
      return validationResult as IValidationResponse;
    }

    const validator = new VerifiableCredentialValidation(options, this.expected);
    const validationResult = await validator.validate(<object>queueItem.tokenToValidate.rawToken, siopDid);
    return validationResult as IValidationResponse;
  }

  /**
   * Get tokens from current item and add them to the queue.
   * @param validationResponse The response for the requestor
   * @param queue with tokens to validate
   */
  public getTokens(_validationResponse: IValidationResponse, _queue: ValidationQueue): IValidationResponse {
    throw new ValidationError(`Not implemented`, errorCode(1));
  }

  /**
   * Gets the type of token to validate
   */
  public get isType(): TokenType {
    return TokenType.verifiableCredential;
  }
}

