/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { InputDescriptorModel } from '../../index';

/**
 * Class to model the presentation_definition as defined by Presentation Exchange.
 * See https://identity.foundation/presentation-exchange/#presentation-definition
 */
export class PresentationDefinitionModel {
 /**
   * Create an instance of PresentationDefinitionModel
   * @param inputDescriptorModel InputDescriptorModel instance
   */
  constructor (
    /**
     * The resource MUST contain this property, and its value MUST be an array of Input Descriptor objects.
     */
    public input_descriptors: InputDescriptorModel[],
    
    /**
     * The resource MAY contain this property, and if present its value SHOULD be a human-friendly name that describes what the Presentation Definition pertains to.
     */
    public name?: string,
    /**
     * The resource MAY contain this property, and if present its value MUST be a string that describes the purpose for which the Presentation Definition’s inputs are being requested.
     */
    public purpose?: string) {
  }
}