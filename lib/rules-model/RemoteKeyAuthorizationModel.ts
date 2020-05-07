/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Model representing a Remote Key Authorization payload
 */
export class RemoteKeyAuthorizationModel {
  constructor (public method?: string) {
  }

  /**
   * Populate an instance of RemoteKeyAuthorizationModel from any instance
   * @param input object instance to populate from
   */
  populateFrom (input: any): void {
    this.method = input.method;
  }
}
