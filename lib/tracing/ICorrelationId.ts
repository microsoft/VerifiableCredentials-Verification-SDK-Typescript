/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

 /**
 * Interface to update correlation vectors
 */
export default interface ICorrelationId {

    /**
     * Increment the vector for a new leg
     */
    increment(): string,

    /**
     * Extend the vector for a new transaction
     */
    extend(): string,

    /**
     * Gets the current correlation id
     */
    correlationId: string;
}
