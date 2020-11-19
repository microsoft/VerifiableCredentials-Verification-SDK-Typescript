/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TransformModel } from './TransformModel';

/**
 * Model for representing an InputClaim in the Input file
 */
export class InputClaimModel {
  /**
   *
   * @param claim the name of the claim
   * @param type hint indicating what the type of the claim must be
   * @param required flag indicating if the claim is required
   * @param indexed flag indicating whether or not this claim may be indexed for Verifiable Credential searching
   * @param transform TransformModel instance
   */
  constructor(
    public claim?: string,
    public type?: string,
    public required: boolean = false,
    public indexed: boolean = false,
    public transform?: TransformModel
  ) {
  }

  /**
   * Populate an instance of InputClaimModel from any instance
   * @param input object instance to populate from
   */
  populateFrom(input: any): void {
    this.claim = input.claim;
    this.required = input.required;
    this.type = input.type;
    this.transform = input.transform;
    this.indexed = input.indexed;
  }

  /**
   * Creates an InputClaimInstance for a contract using a subset of properties
   */
  forInput(): InputClaimModel {
    return new InputClaimModel(this.claim, this.type, this.required, this.indexed);
  }
}
