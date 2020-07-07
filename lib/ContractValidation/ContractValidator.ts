/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Ajv from 'ajv';
import { contractSchema } from './ContractSchema';
import { ContractValidationResponse } from './ContractValidationResponse';

/**
 * Class used to Validate Contracts based on Contract Schema.
 */
export class ContractValidator {

  private ajv = new Ajv()

  /**
   * Validate contract using Contract Schema.
   * @param contract Contract to be validated.
   */
  public validate(contract: any): ContractValidationResponse {
    const isValid = this.ajv.validate(contractSchema, contract)
    if (!isValid) {
      const errorMessages = this.ajv.errorsText()
      return {
        result: false,
        status: 400,
        detailedError: errorMessages,
        contract
      }
    }
    return {
      result: true,
      status: 200,
      contract
    }
  }
}