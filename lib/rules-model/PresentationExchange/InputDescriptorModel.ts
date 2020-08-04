/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PresentationExchangeSchemaModel, PresentationExchangeIssuanceModel, PresentationExchangeConstraintsModel } from '../../index';

/**
 * Class to model the preseninput_descriptors as defined by Presentation Exchange.
 * Input Descriptors are objects that describe what type of input data/credential, or sub-fields thereof, is required for submission to the Verifier.
 */
export class InputDescriptorModel {
     /**
   * Create an instance of InputDescriptorModel
   * @param id for the input definition
   * @param presentationExchangeSchemaModel schema for the input definition
   */
  constructor (
    public id: string,
    public schema: PresentationExchangeSchemaModel,
    public issuance: PresentationExchangeIssuanceModel[],
    public constraints: PresentationExchangeConstraintsModel) {
  }

}