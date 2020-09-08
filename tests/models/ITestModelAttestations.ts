/**
 * Interface to model your attestation request
 */

import { ClaimToken, IRequestorAttestation } from "../../lib";


export default interface ITestModelAttestations {
    clientId: string;

    /**
     * Define the model for the request
     */
    presentationAttestationRequest: IRequestorAttestation;

    /**
     * Define the model for the response
     */
    presentationAttestationResponse: any;

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