/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CryptoBuilder, DidValidation, IExpectedStatusReceipt, TokenType, ValidationOptions, ValidatorBuilder, VerifiablePresentationStatusReceipt } from '../lib/index';

describe('VerifiablePresentationStatusReceipt', () => {
  it('should test validate', async () => {
    let receipts = {};
    let validatorBuilder = new ValidatorBuilder(new CryptoBuilder().build());
    let validationOptions = new ValidationOptions(<any>{ invalidTokenError: ValidatorBuilder.INVALID_TOKEN_STATUS_CODE }, TokenType.verifiablePresentationStatus);
    let expected: IExpectedStatusReceipt = {
      didAudience: 'didAudience',
      didIssuer: 'issuer',
      type: TokenType.verifiablePresentationStatus
    };

    let verifiablePresentationStatusReceipt = new VerifiablePresentationStatusReceipt(receipts, validatorBuilder, validationOptions, expected);
    expect(verifiablePresentationStatusReceipt.verifiablePresentationStatus).toBeUndefined();

    try {
      await verifiablePresentationStatusReceipt.validate();
    } catch (exception) {
      expect(exception.message).toEqual('The status receipt is missing receipt');
      expect(exception.code).toEqual('VCSDKVPSC01');
    }
    let validator = verifiablePresentationStatusReceipt.didValidation;
    expect(validator.constructor.name).toEqual('DidValidation');

    validator = new DidValidation(validationOptions, expected);
    let validatorSpy = spyOn(validator, "validate").and.callFake(() => {
      return <any>{ result: false, status: ValidatorBuilder.INVALID_TOKEN_STATUS_CODE };
    });

    verifiablePresentationStatusReceipt = new VerifiablePresentationStatusReceipt({ receipt: [{}] }, validatorBuilder, validationOptions, expected);
    verifiablePresentationStatusReceipt.didValidation = validator;
    let response = await verifiablePresentationStatusReceipt.validate();
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);

    validatorSpy.and.callFake(() => {
      return <any>{ result: true, payloadObject: { aud: '' } };
    });
    response = await verifiablePresentationStatusReceipt.validate();
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);

    validatorSpy.and.callFake(() => {
      return <any>{ result: true, payloadObject: { aud: 'didAudience', issuer: '' } };
    });
    response = await verifiablePresentationStatusReceipt.validate();
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
  });
});
