/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Model to express a Refresh Configuration
 */
export class RefreshConfigurationModel {
  /**
   *
   * @param validityInterval the interval in seconds for enabling refresh
   */
  constructor (public validityInterval?: number) {
  }

  /**
   * Populate an instance of RemoteKeyAuthorizationModel from any instance
   * @param input object instance to populate from
   */
  populateFrom (input: any): void {
    this.validityInterval = input.validityInterval;
  }
}
