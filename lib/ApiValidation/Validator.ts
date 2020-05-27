/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BasicValidatorOptions, ClaimToken, IDidResolver, ISiopValidationResponse, ITokenValidator, ValidatorBuilder } from '../index';
import { IValidationResponse } from '../InputValidation/IValidationResponse';
import ValidationQueue from '../InputValidation/ValidationQueue';
import ValidationQueueItem from '../InputValidation/ValidationQueueItem';
import ValidationOptions from '../Options/ValidationOptions';
import { TokenType } from '../VerifiableCredential/ClaimToken';
import IValidationResult from './IValidationResult';

/**
 * Class model the token validator
 */
export default class Validator {

  constructor(private _builder: ValidatorBuilder) {
  }

  /**
   * Gets the builder for the validator
   */
  public get builder(): ValidatorBuilder {
    return this._builder;
  }

  /**
   * Gets the resolver
   */
  public get resolver(): IDidResolver {
    return this.builder.resolver;
  }

  /**
   * Gets the token validators
   */
  public get tokenValidators(): { [type: string]: ITokenValidator } {
    return this.builder.tokenValidators;
  }

  /**
   * The validation handler
   * @param token to validate
   */
  public async validate(token: string): Promise<IValidationResponse> {
    const validatorOption = new BasicValidatorOptions(this.resolver);
    let options = new ValidationOptions(validatorOption, TokenType.siop);
    let response: IValidationResponse = {
      result: true,
      status: 200,
    };
    let claimToken: ClaimToken;
    let siopDid: string | undefined;
    let siopContract: string | undefined;
    const queue = new ValidationQueue();
    queue.enqueueToken('siop', token);
    let queueItem = queue.getNextToken();
    do {
      claimToken = Validator.getTokenType(queueItem!);
      const validator = this.tokenValidators[claimToken.type];
      if (!validator) {
        return new Promise((_, reject) => {
          reject(`${claimToken.type} does not has a TokenValidator`);
        });
      }

      switch (claimToken.type) {
        case TokenType.idToken:
          options = new ValidationOptions(validatorOption, claimToken.type);
          response = await validator.validate(queue, queueItem!, '', siopContract);
          break;
        case TokenType.verifiableCredential:
          options = new ValidationOptions(validatorOption, claimToken.type);
          response = await validator.validate(queue, queueItem!, siopDid!, siopContract!);
          break;
        case TokenType.verifiablePresentation:
          options = new ValidationOptions(validatorOption, claimToken.type);
          response = await validator.validate(queue, queueItem!, siopDid!);
          break;
        case TokenType.siop:
          options = new ValidationOptions(validatorOption, claimToken.type);
          response = await validator.validate(queue, queueItem!);
          siopDid = response.did;
          siopContract = Validator.getContractIdFromSiop(response.payloadObject.contract);
          break;
        case TokenType.selfIssued:
          options = new ValidationOptions(validatorOption, claimToken.type);
          response = await validator.validate(queue, queueItem!);
          break;
        default:
          return new Promise((_, reject) => {
            reject(`${claimToken.type} is not supported`);
          });
      }
      // Save result
      queueItem!.setResult(response, claimToken);

      // Get next token to validate
      queueItem = queue.getNextToken();
    } while (queueItem);

    // Set output
    response = queue.getResult();
    if (response.result) {
      // set claims
      response = {
        result: true,
        status: 200,
        validationResult: this.setValidationResult(queue),
        payloadObject: response.payloadObject,
      };
    }
    return response;
  }

  private setValidationResult(queue: ValidationQueue): IValidationResult {
    // get user DID from SIOP or VC
    let did = queue.items.filter((item) => item.validatedToken?.type === TokenType.siop).map((siop) => {
      return siop.validationResponse.did;
    })[0];
    if (!did) {
      did = queue.items.filter((item) => item.validatedToken?.type === TokenType.verifiableCredential).map((vc) => {
        return vc.validatedToken?.decodedToken.aud;
      })[0];
    }

    // Set the contract
    const contract = queue.items.filter((item) => item.validatedToken?.type === TokenType.siop).map((siop) => {
      return (siop.validationResponse as ISiopValidationResponse).payloadObject.contract;
    })[0];

    // Set the jti
    const jti = queue.items.filter((item) => item.validatedToken?.type === TokenType.siop).map((siop) => {
      return (siop.validationResponse as ISiopValidationResponse).payloadObject.jti;
    })[0];

    // get id tokens
    const idTokens: { [id: string]: any } = {};
    for (let inx = 0, tokens = queue.items.filter((item) => item.validatedToken?.type === TokenType.idToken); inx < tokens.length; inx++) {
      idTokens[tokens[inx].id] = tokens[inx].validatedToken?.decodedToken;
    }

    // get verifiable credentials
    const vcs: { [id: string]: any } = {};
    for (let inx = 0, tokens = queue.items.filter((item) => item.validatedToken?.type === TokenType.verifiableCredential); inx < tokens.length; inx++) {
      vcs[tokens[inx].id] = tokens[inx].validatedToken?.decodedToken;
    }

    // get self issued
    const si = queue.items.filter((item) => item.validatedToken?.type === TokenType.selfIssued).map((si) => {
      return si.validatedToken?.decodedToken;
    })[0];

    const validationResult: IValidationResult = {
      did: did ? did : '',
      contract: contract ? contract : '',
      verifiableCredentials: vcs,
      idTokens: idTokens,
      selfIssued: si,
      siopJti: jti ?? '',
    }
    return validationResult;
  }

  /**
   * Extract contract id from the siop contract url
   * @param contractUrl The contract url
   */
  public static getContractIdFromSiop(contractUrl: string) {
    const contractTypeSplitted = contractUrl.split('/');
    const contractId = contractTypeSplitted[contractTypeSplitted.length - 1];
    return contractId;
  }

  /**
   * Check the token type based on the payload
   * @param validationOptions The options
   * @param token to check for type
   */
  private static getTokenType(queueItem: ValidationQueueItem): ClaimToken {
    const claimToken = queueItem.claimToken ?? ClaimToken.getTokenType(queueItem.tokenToValidate);
    return claimToken;
  }
}