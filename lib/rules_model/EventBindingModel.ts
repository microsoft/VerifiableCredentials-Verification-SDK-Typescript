/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AuthenticationModel } from "./AuthenticationModel";
import { DataProviderModel } from "./DataProviderModel";

/**
 * Data Model to describe external service authentication
 */
export class EventBindingModel {

  /**
   * DataProviderModel instance describing token augmentation process
   */
  public onTokenAugmentation?: DataProviderModel

  /**
   * Populate an instance of AuthenticationModel from any instance
   * @param input object instance to populate from
   * @param authentication AuthenticationModel instance from the parent object
   */
  static fromJSON(input: any, authentication?: AuthenticationModel): EventBindingModel {
    const { onTokenAugmentation } = input;
    const result = new EventBindingModel();

    if (onTokenAugmentation) {
      result.onTokenAugmentation = DataProviderModel.fromJSON(onTokenAugmentation, authentication);
    }

    return result;
  }
}