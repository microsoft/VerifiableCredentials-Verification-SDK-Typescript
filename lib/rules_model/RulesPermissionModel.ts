/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RulesValidationError } from '../error_handling/RulesValidationError';

export class RulesPermissionModel {
  /**
   * Creates a new RulesPermissionModel instance.
   * @param block Blocked DIDs.
   * @param allow Allowed DIDs.
   */
  constructor (public block?: string[], public allow?: string[]) {}

  /**
   * Creates a new RulesPermissionModel instance from the given input.
   * @param input Input from which to populate instance.
   */
  public static create(input: { [key: string]: any }): RulesPermissionModel {
    const instance = new RulesPermissionModel();
    instance.populateFrom(input);
    return instance;
  }

  /**
   * Parses the given input into the current RulesPermissionModel instance.
   * @param input Input from which to populate instance.
   */
  public populateFrom(input: { [key: string]: any }): void {
    const { allow, block } = input;
    this.allow = RulesPermissionModel.validateDidList(allow);
    this.block = RulesPermissionModel.validateDidList(block);

    if (!(this.allow || this.block)) {
      throw new RulesValidationError('Empty permissions models are not allowed.');
    }
  }

  private static validateDidList (didList?: string[]): string[] | undefined {
    if (!didList) {
      return undefined;
    }

    const uniqueDids = new Set(didList);

    if (uniqueDids.size !== didList.length) {
      throw new RulesValidationError('Non-unique DID(s) found in one or more permission lists.');
    }

    return didList;
  }
}
