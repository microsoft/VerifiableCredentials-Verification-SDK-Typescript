/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BaseIssuanceModel } from '../../index';

/**
 * Class to model the constraints as defined by Presentation Exchange.
 */
export class PresentationExchangeConstraintsModel {
     /**
   * Create an instance of PresentationExchangeConstraintsModel
   * @param path for the constraint
   * @param name for the schema
   * @param purpose of the schema
   */
  constructor (

    /**
     * The object MUST contain a path property, and its value MUST be an array of one or more JSONPath string expressions, as defined in the JSONPath Syntax Definition section, that select some subset of values from the target input.
     */
    public path?: string[],

    /**
     * The object MAY contain a filter property, and if present its value MUST be JSON Schema descriptor used to filter against the values returned from evaluation of the JSONPath string expressions in the path array.
     */
    public filter?: any,
    /**
     * The object MAY contain a purpose property, and if present its value MUST be a string that describes the purpose for which the field is being requested.
     */
    public purpose?: string) {
  }

  /**
   * Populate this object from a model
   * @param input model to populate object
   */
  public populateFrom(_input: PresentationExchangeConstraintsModel): PresentationExchangeConstraintsModel {
    return this;
  }

}