/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PresentationExchangeInputDescriptorModel } from '../../index';

/**
 * Class to model the presentation_definition as defined by Presentation Exchange.
 * See https://identity.foundation/presentation-exchange/#presentation-definition
 */
export class PresentationDefinitionModel {
 /**
   * Create an instance of PresentationDefinitionModel
   * @param PresentationExchangeInputDescriptorModel PresentationExchangeInputDescriptorModel instance
   */
  constructor (
    /**
     * The resource MUST contain this property, and its value MUST be an array of Input Descriptor objects.
     */
    public input_descriptors?: PresentationExchangeInputDescriptorModel[],
    
    /**
     * The resource MAY contain this property, and if present its value SHOULD be a human-friendly name that describes what the Presentation Definition pertains to.
     */
    public name?: string,
    /**
     * The resource MAY contain this property, and if present its value MUST be a string that describes the purpose for which the Presentation Definition’s inputs are being requested.
     */
    public purpose?: string) {
  }
  
  /**
   * Populate this object from a model
   * @param input model to populate object
   */
  public populateFrom(input: PresentationDefinitionModel): PresentationDefinitionModel {
    this.name = input.name;
    this.purpose = input.purpose;
    this.input_descriptors = [];
    const objectToPopulate = new PresentationExchangeInputDescriptorModel();
    for (let inx = 0; input.input_descriptors && inx < input.input_descriptors.length ; inx++ ) {
      const item: PresentationExchangeInputDescriptorModel = input.input_descriptors[inx];
      this.input_descriptors.push(objectToPopulate.populateFrom(item));
    }
    return this;
  }
}