/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TSMap } from "typescript-map";
import { IExpected, ITokenValidator, TokenType } from '../index';
import { IValidationResponse } from '../InputValidation/IValidationResponse';
import ValidationQueue from '../InputValidation/ValidationQueue';
import ValidationQueueItem from '../InputValidation/ValidationQueueItem';
import { VerifiableCredentialValidation } from '../InputValidation/VerifiableCredentialValidation';
import IValidatorOptions from '../Options/IValidatorOptions';
import ValidationOptions from '../Options/ValidationOptions';

/**
 * Class to validate a token
 */
export default class VerifiableCredentialTokenValidator implements ITokenValidator {

  /**
   * Create new instance of <see @class VerifiableCredentialTokenValidator>
   * @param validatorOption The options used during validation
   * @param expectedMap values to find in the token to validate
   */
  constructor(private validatorOption: IValidatorOptions, private expectedMap: TSMap<string, IExpected>) {
  }


  /**
   * Validate the token
   * @param queue with tokens to validate
   * @param queueItem under validation
   * @param siopDid needs to be equal to audience of VC
   */
  public async validate(_queue: ValidationQueue, queueItem: ValidationQueueItem, siopDid: string): Promise<IValidationResponse> {
    const options = new ValidationOptions(this.validatorOption, TokenType.verifiableCredential);

    // find the correct IExpected instance, if not mapped, it's a bad request
    if (!this.expectedMap.has(queueItem.id)) {
      const validationResponse: IValidationResponse = {
        result: false,
        status: 400,
        detailedError: `Unexpected Verifiable Credential of type ${queueItem.id}`
      };

      return validationResponse;
    }

    const expected = this.expectedMap.get(queueItem.id);
    const validator = new VerifiableCredentialValidation(options, expected, siopDid);
    const validationResult = await validator.validate(queueItem.tokenToValidate);
    return validationResult as IValidationResponse;
  }

  /**
   * Gets the type of token to validate
   */
  public get isType(): TokenType {
    return TokenType.verifiableCredential;
  }
}

