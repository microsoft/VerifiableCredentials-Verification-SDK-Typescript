/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import AbortController from 'abort-controller';

import IFetchRequest from "./IFetchRequest";
const MSCV = 'MS-CV';

 /**
 * Do the fetch requests.
 * It allows a service to implement its own fetch with instrumentation.
 */
export default class FetchRequest implements IFetchRequest {

  /**
   * Create new instance of FetchRequest
   */
  constructor() {
  }

  /**
   * Do fetch call and handle correlation id
   * @param url to fetch
   * @param method method name
   * @param options fetch options
   */
  public async fetch(url: string, _method: string, options: any): Promise<Response> {
    options = options || { 
      headers: {}
    };

    if (!options.headers) {
      options.headers = {};
    }

    // Get timeout from options. Default to 10 seconds.
    const { timeout = 10000 } = options;
    const abortController = new AbortController();
    options.signal = abortController.signal;
    
    const id = setTimeout(() => {
      abortController.abort()
    }, timeout);


    const response = await fetch(url, options);
    clearTimeout(id);
    return response;
  }
}
