/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType, IExpected, ITokenValidator, ClaimToken } from '../index';
import { IValidationResponse } from '../InputValidation/IValidationResponse';
import ValidationOptions from '../Options/ValidationOptions';
import { VerifiablePresentationValidation } from '../InputValidation/VerifiablePresentationValidation';
import IValidatorOptions from '../Options/IValidatorOptions';
import { VerifiableCredentialValidation } from '../InputValidation/VerifiableCredentialValidation';
import { IdTokenValidation } from '../InputValidation/IdTokenValidation';
import { IValidationOptions } from '../Options/IValidationOptions';

/**
 * Class to validate a token
 */
export default class VerifiableCredentialTokenValidator implements ITokenValidator {

  /**
   * Create new instance of <see @class TokenValidator>
   * @param tokenType The type to validate
   */
  constructor () {
  }


  /**
   * Validate the token
   * @param validatorOption The options used during validation
   * @param token to validate
   * @param expected values to find in the token to validate
   */
  public async validate(validatorOption: IValidatorOptions, token: ClaimToken, expected: IExpected): Promise<IValidationResponse> { 
    const options = new ValidationOptions(validatorOption, 'verifiable credential');
    const validator = new VerifiableCredentialValidation(options, expected);
    const validationResult = await validator.validate(token.rawToken);
    return validationResult as IValidationResponse; 
  }
 
  /**
   * Gets the type of token to validate
   */
  public get isType(): TokenType {
    return TokenType.verifiableCredential;
  }
}

