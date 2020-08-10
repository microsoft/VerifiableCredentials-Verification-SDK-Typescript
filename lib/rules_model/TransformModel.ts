/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Model for representing a Transform property in an InputClaimModel
 */
export class TransformModel {
  /**
   *
   * @param name The name of the Transform function
   * @param remote A url to a remote transform function
   */
  constructor (public name?: string, public remote?: string) {
  }

  /**
   * Populate an instance of TransformModel from any instance
   * @param input object instance to populate from
   */
  populateFrom (input: any): void {
    this.name = input.name;
    this.remote = input.remote;
  }
}
