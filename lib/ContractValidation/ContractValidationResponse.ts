/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IValidationResponse } from '../InputValidation/IValidationResponse';

export interface ContractValidationResponse extends IValidationResponse {

  /**
   * The contract that was passed into the Validator.
   */
  contract: any;

}