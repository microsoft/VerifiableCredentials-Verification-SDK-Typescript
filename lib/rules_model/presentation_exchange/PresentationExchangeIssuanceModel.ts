/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BaseIssuanceModel } from '../../index';

/**
 * Class to model the issuance as defined by Presentation Exchange.
 */
export class PresentationExchangeIssuanceModel {
     /**
   * Create an instance of PresentationExchangeIssuanceModel
   * @param manifest for the issuance (contract)
   */
  constructor (

    /**
     * The url to the contract
     */
    public manifest?: string) {
  }

  /**
   * Populate this object from a model
   * @param input model to populate object
   */
  public populateFrom(input: PresentationExchangeIssuanceModel): PresentationExchangeIssuanceModel {
    this.manifest = input.manifest;
    return this;
  }
}