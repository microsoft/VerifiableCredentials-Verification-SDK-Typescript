/**
 * Interface to model your presentation exchange request
 */

import { IRequestorPresentationExchange } from "../../lib";


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
     * Return all presentations
     */
    getPresentations(): {[key: string]: any};
}