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
   * @param url to fetch
   * @param callingMethodName Calling method name
   * @param options fetch options
   */
  fetch(url: string, callingMethodName: string, options?: any): Promise<Response>;
}
