/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

 /**
 * Interface to do fetch requests.
 * It allows a service to implement its own fetch with instrumentation.
 */
export default interface IFetchRequest {

  /**
   * Do fetch call
   */
  fetch(url: string, method: string, options?: any): Promise<Response>;
  
  /**
   * Gets and sets the correlation id value
   */
  correlationId: string;
}
