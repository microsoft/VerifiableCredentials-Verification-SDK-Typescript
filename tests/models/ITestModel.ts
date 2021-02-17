/**
 * Interface to model your presentation exchange request
 */

import { IRequestorPresentationExchange, ClaimToken, IRequestorAttestation } from "../../lib";


export default interface ITestModel {
    clientId: string;

    /**
     * Define the model for the request
     */
    request: IRequestorPresentationExchange | IRequestorAttestation;

    /**
     * Define the model for the response
     */
    response: any;

    /**
     * Define the status response
     */
    responseStatus: any;

    /**
     * Define a set of operations to perform on response payload before signing the SIOP
     */
     preSiopResponseOperations?: any[];

    /**
     * Define a set of operations to perform on response payload before signing the tokens
     */
     preSignatureResponseOperations?: any[];

    /**
     * Retrieve VC
     * @param key of the VC
     */
    getVcFromResponse(key: string): ClaimToken | undefined;

    /**
     * Return all presentations
     */
    getPresentationsFromModel(): {[key: string]: any} | undefined;

    /**
     * Return all non presented VCs
     */
    getNonPresentedVcFromModel(): {[key: string]: any};
    
    /**
     * Return all id tokens from model
     */
    getIdTokensFromModel(): {[key: string]: any};
}