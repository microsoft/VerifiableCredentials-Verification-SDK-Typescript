/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDidResolver, Crypto } from '../index';
import IFetchRequest from '../tracing/IFetchRequest';

/**
 * Interface to model the fetch options
 */
export interface IHttpClientOptions {

    /**
     * The http client options
     */
    options: any,
}

 /**
 * Interface to model the validator options
 */
export default interface IValidatorOptions {

    /**
     * The DID resolver
     */
    resolver: IDidResolver,

    /**
     * The fetch client
     */
    fetchRequest: IFetchRequest,

    /**
     * Get the crypto options
     */
    crypto: Crypto
}
