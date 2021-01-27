/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import AbortController from 'abort-controller';
import { Agent } from 'https';
import IFetchRequest from "./IFetchRequest";

/**
* Do the fetch requests.
* It allows a service to implement its own fetch with instrumentation.
*/
export default class FetchRequest implements IFetchRequest {

  /**
    * Agent instance for connection reuse
    */
  private readonly agent: Agent;

  /**
   * Create new instance of FetchRequest
   */
  constructor() {
    this.agent = new Agent({ keepAlive: true });
  }

  /**
   * Do fetch call
   * @param url to fetch
   * @param callingMethodName Calling method name
   * @param options fetch options
   */
  public async fetch(url: string, _callingMethodName: string, options: any): Promise<Response> {
    if (options) {
      options.agent = this.agent
    } else {
      options = {
        agent: this.agent
      }
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
