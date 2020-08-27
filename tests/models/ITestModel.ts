/**
 * Interface to model your presentation exchange request
 */

import { IRequestorPresentationExchange, ClaimToken } from "../../lib";


export default interface ITestModel {
    clientId: string;

    /**
     * Define the model for the request
     */
    presentationExchangeRequest: IRequestorPresentationExchange;

    /**
     * Define the model for the response
     */
    presentationExchangeResponse: any;

    /**
     * Define the status response
     */
    responseStatus: any;

    /**
     * Define a set of operations to perform on response payload
     */
    responseOperations?: any[];

    /**
     * Retrieve VC
     * @param key of the VC
     */
    getVcFromResponse(key: string): ClaimToken;

    /**
     * Return all presentations
     */
    getPresentations(): {[key: string]: any};
}