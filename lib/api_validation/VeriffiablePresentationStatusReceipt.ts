/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IValidationResponse, SiopValidation, IValidationOptions, IExpectedSiop } from '../index';

export interface IVerifiablePresentationStatus {
    id: string;
    status: string;
    reason: string;
}

export default class VerifiablePresentationStatusReceipt {
    constructor(public receipt: string, private options: IValidationOptions, private expected: IExpectedSiop) {
    }

    private _verifiablePresentationStatus: IVerifiablePresentationStatus[] | undefined;
        
    public get verifiablePresentationStatus(): IVerifiablePresentationStatus[] | undefined {
        return this._verifiablePresentationStatus;
    }

    public async validate(): Promise<IValidationResponse> {
        const siopValidator = new SiopValidation(this.options, this.expected);
        const receiptResponse = await siopValidator.validate(this.receipt);
        if (!receiptResponse.result) {
            return receiptResponse;
        }

        // Check each entry in the receipt

        // aud must match the did of the status request


        return receiptResponse;
    }
}