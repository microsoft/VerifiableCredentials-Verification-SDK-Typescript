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

    responseStatus: any;

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