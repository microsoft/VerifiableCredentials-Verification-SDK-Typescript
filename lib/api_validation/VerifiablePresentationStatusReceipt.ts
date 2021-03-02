/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import ErrorHelpers from '../error_handling/ErrorHelpers';
import { IValidationResponse, IValidationOptions, TokenType, ValidatorBuilder, DidValidation, IExpectedStatusReceipt, ClaimToken } from '../index';
const errorCode = (error: number) => ErrorHelpers.errorCode('VCSDKVPSR', error);

export interface IVerifiablePresentationStatus {
  id: string;
  status: string;
  reason: string;
  passed: boolean;
  token: ClaimToken;
}

/**
 * Class to validate status receipts
 */
export default class VerifiablePresentationStatusReceipt {

  constructor(private validationBuilder: ValidatorBuilder, private options: IValidationOptions, private expected: IExpectedStatusReceipt) {}

  private _verifiablePresentationStatus: { [jti: string]: IVerifiablePresentationStatus } | undefined;
  private _didValidation: DidValidation | undefined;

  /**
   * Gets the result of the status
   */
  public get verifiablePresentationStatus(): { [jti: string]: IVerifiablePresentationStatus } | undefined {
    return this._verifiablePresentationStatus;
  }

  /**
   * Gets the DID validator
   */
  public get didValidation(): DidValidation | undefined {
    return this._didValidation;
  }

  /**
   * Sets the DID validator
   */
  public set didValidation(validator: DidValidation | undefined) {
    this._didValidation = validator;
  }

  /**
   * The status validator
   */
  public async validate(receipts: any): Promise<IValidationResponse> {
    // create new validator for receipt
    if (!receipts?.receipt) {
      return {
        result: false,
        status: 403,
        code: errorCode(1),
        detailedError: 'The status receipt is missing receipt'
      }
    }

    // Check each entry in the receipt
    this._verifiablePresentationStatus = {};
    for (let jti in receipts.receipt) {
      const receipt = receipts.receipt[jti];
      let didValidation = this.didValidation || new DidValidation(this.options, this.expected);
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
      if (receiptResponse.issuer !== this.expected.didIssuer) {
        return {
          result: false,
          status: 403,
          code: errorCode(2),
          detailedError: `The status receipt iss '${receiptResponse.issuer}' is wrong. Expected '${this.expected.didIssuer}'`
        }
      }

      this._verifiablePresentationStatus[jti] = <IVerifiablePresentationStatus>{
        id: jti,
        reason: receiptResponse.payloadObject.credentialStatus?.reason,
        status: receiptResponse.payloadObject.credentialStatus?.status,
        passed: receiptResponse.payloadObject.credentialStatus?.status?.toLowerCase() === 'valid',
        token: new ClaimToken(TokenType.verifiablePresentationStatus, receipt)
      };

      if (!this.verifiablePresentationStatus![jti].passed) {
        return {
          result: false,
          status: 403,
          code: errorCode(3),
          detailedError: `The status receipt for jti '${jti}' failed with status ${this.verifiablePresentationStatus![jti].status}.`
        }
      }
    }

    return {
      result: true,
      status: 200,
      validationResult: { verifiablePresentationStatus: this.verifiablePresentationStatus }
    };
  }
}