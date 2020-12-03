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
   * 
   * @param onTokenAugmentation DataProviderModel instance describing token augmentation process
   */
  constructor(public onTokenAugmentation?: DataProviderModel) { }

  /**
   * Populate an instance of AuthenticationModel from any instance
   * @param input object instance to populate from
   * @param authentication AuthenticationModel instance from the parent object
   */
  populateFrom(input: any, authentication?: AuthenticationModel): void {
    const { onTokenAugmentation } = input;

    if(onTokenAugmentation){
      this.onTokenAugmentation = new DataProviderModel();
      this.onTokenAugmentation.populateFrom(onTokenAugmentation, authentication);
    }
  }
}