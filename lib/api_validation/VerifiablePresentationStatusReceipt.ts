/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IValidationResponse, SiopValidation, IValidationOptions, IExpectedSiop, ValidatorBuilder, DidValidation, IExpectedStatusReceipt } from '../index';
import { resolve } from 'dns';

export interface IVerifiablePresentationStatus {
    id: string;
    status: string;
    reason: string;
}

export default class VerifiablePresentationStatusReceipt {
    constructor(public receipts: any, private validationBuilder: ValidatorBuilder, private options: IValidationOptions, private expected: IExpectedStatusReceipt) {
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
                    const didValidation = new DidValidation(this.options, this.expected);
                    const receiptResponse = await didValidation.validate(receipt);
                    if (!receiptResponse.result) {
                        return receiptResponse;
                    }

                    // aud should correspond requestor
                    if (receiptResponse.payloadObject.aud !== this.expected.didAudience) {
                        return {
                            result: false,
                            status: 403,
                            detailedError: `The status receipt aud '${receiptResponse.payloadObject.aud}' is wrong. Expected '${this.expected.didAudience}'`
                        }
                    }

                    // iss should correspond issuer VC
                    if (receiptResponse.payloadObject.iss !== this.expected.didIssuer) {
                        return {
                            result: false,
                            status: 403,
                            detailedError: `The status receipt iss '${receiptResponse.payloadObject.iss}' is wrong. Expected '${this.expected.didIssuer}'`
                        }
                    }
    
                }
                
               return {
                   result: true,
                   status: 200
               };
    }
}