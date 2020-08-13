/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PresentationExchangeSchemaModel, PresentationExchangeIssuanceModel, PresentationExchangeConstraintsModel } from '../../index';

/**
 * Class to model the preseninput_descriptors as defined by Presentation Exchange.
 * Input Descriptors are objects that describe what type of input data/credential, or sub-fields thereof, is required for submission to the Verifier.
 */
export class PresentationExchangeInputDescriptorModel {
  /**
* Create an instance of PresentationExchangeInputDescriptorModel
* @param id for the input definition
* @param schema schema for the input definition
* @param issuance issuance for the input definition
* @param constraints constraints for the input definition
*/
  constructor(
    public id?: string,
    public schema?: PresentationExchangeSchemaModel,
    public issuance?: PresentationExchangeIssuanceModel[],
    public constraints?: PresentationExchangeConstraintsModel) {
  }

  /**
   * Populate this object from a model
   * @param input model to populate object
   */
  public populateFrom(input: PresentationExchangeInputDescriptorModel): PresentationExchangeInputDescriptorModel {
    this.id = input.id;
    if (input.schema) {
      const objectToPopulate = new PresentationExchangeSchemaModel();
      this.schema = objectToPopulate.populateFrom(input.schema);
    }
    if (input.issuance) {
      this.issuance = [];
      const objectToPopulate = new PresentationExchangeIssuanceModel();
      for (let inx = 0; inx < input.issuance.length; inx++) {
        const item: PresentationExchangeIssuanceModel = input.issuance[inx];
        this.issuance.push(objectToPopulate.populateFrom(item));
      }
    } else {
      delete this.issuance;
    }

    return this;
  }
}