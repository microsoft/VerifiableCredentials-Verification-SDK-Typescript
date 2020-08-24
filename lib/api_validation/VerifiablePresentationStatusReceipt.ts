/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IValidationResponse, SiopValidation, IValidationOptions, IExpectedSiop, ValidatorBuilder } from '../index';
import { resolve } from 'dns';

export interface IVerifiablePresentationStatus {
    id: string;
    status: string;
    reason: string;
}

export default class VerifiablePresentationStatusReceipt {
    constructor(public receipts: any, private validationBuilder: ValidatorBuilder, private options: IValidationOptions, private expected: IExpectedSiop) {
    }

    private _verifiablePresentationStatus: IVerifiablePresentationStatus[] | undefined;

    public get verifiablePresentationStatus(): IVerifiablePresentationStatus[] | undefined {
        return this._verifiablePresentationStatus;
    }

    public async validate(): Promise<IValidationResponse> {
        // create new validator for receipt
                if (!this.receipts?.receipt) {
                    return {
                        result: false,
                        status: 403,
                        detailedError: 'The status receipt is missing receipt'
                    }
                }
                // Check each entry in the receipt
                this._verifiablePresentationStatus = [];
                for (let jti in this.receipts.receipt) {
                    const receipt = this.receipts.receipt[jti];
                    const siopValidator = new SiopValidation(this.options, this.expected);
                    const receiptResponse = await siopValidator.validate(receipt);
                    if (!receiptResponse.result) {
                        return receiptResponse;
                    }
    
                }
        
                // aud must match the did of the status request
        
        
                
               return new Promise<any>((resolve) => resolve({}));
    }
}