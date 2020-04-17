/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ClaimToken, IExpected, IDidResolver, CryptoOptions, ITokenValidator, ISiopValidationResponse } from '../index';
import { TokenType } from '../VerifiableCredential/ClaimToken';
import ValidationOptions from '../Options/ValidationOptions';
import IValidatorOptions from '../Options/IValidatorOptions';
import { KeyStoreInMemory, CryptoFactoryManager, CryptoFactoryNode, SubtleCryptoNode, JoseProtocol, JoseConstants } from '@microsoft/crypto-sdk';
import { IValidationResponse } from '../InputValidation/IValidationResponse';
import ValidationQueue from '../InputValidation/ValidationQueue';
import IValidationResult from './IValidationResult';
import { throws } from 'assert';
import ValidationQueueItem from '../InputValidation/ValidationQueueItem';

/**
 * Class model the token validator
 */
export default class Validator {

  constructor(
    private _tokenValidators: { [type: string]: ITokenValidator },
    private _resolver: IDidResolver) {
  } 

  /**
   * Gets the resolver
   */
  public get resolver(): IDidResolver {
    return this._resolver;
  }

  /**
   * Gets the token validators
   */
  public get tokenValidators(): { [type: string]: ITokenValidator } {
    return this._tokenValidators;
  }

  public async validate(token: string): Promise<IValidationResponse> {
    const validatorOption: IValidatorOptions = this.setValidatorOptions();
    let options = new ValidationOptions(validatorOption, TokenType.siop);
    let response: IValidationResponse = {
      result: true,
      status: 200,
    };
    let claimToken: ClaimToken;
    let siopDid: string | undefined;
    const queue = new ValidationQueue();
    queue.addToken('siop', token);
    let queueItem = queue.getNextToken();
    do {
      [response, claimToken] = Validator.getTokenType(options, queueItem!);
      const validator = this.tokenValidators[claimToken.type];
      if (!validator) {
        return new Promise((_, reject) => {
          reject(`${claimToken.type} does not has a TokenValidator`);
        });
      }
  
      switch (claimToken.type) {
        case TokenType.idToken: 
          options = new ValidationOptions(validatorOption, claimToken.type);
          response = await validator.validate(queue, queueItem!);
          break;
        case TokenType.verifiableCredential: 
          options = new ValidationOptions(validatorOption, claimToken.type);
          response = await validator.validate(queue, queueItem!, siopDid!);
          break;
        case TokenType.verifiablePresentation: 
          options = new ValidationOptions(validatorOption, claimToken.type);
          response = await validator.validate(queue, queueItem!, siopDid!);
          break;
        case TokenType.siop: 
          options = new ValidationOptions(validatorOption, claimToken.type);
          response = await validator.validate(queue, queueItem!);
          siopDid = response.did;
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
    } while(queueItem);

    // Set output
    response =queue.getResult();
    if (response.result) {
      // set claims
      response = {
        result: true,
        status: 200,
        validationResult: this.setValidationResult(queue)
      }
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

    // get id tokens
    const idTokens: {[id: string]: any} = {};
    for (let inx = 0, tokens=queue.items.filter((item) => item.validatedToken?.type === TokenType.idToken) ; inx < tokens.length; inx++) {
      idTokens[tokens[inx].id] = tokens[inx].validatedToken?.decodedToken;
    }

    // get verifiable credentials
    const vcs: {[id: string]: any} = {};
    for (let inx = 0, tokens=queue.items.filter((item) => item.validatedToken?.type === TokenType.verifiableCredential) ; inx < tokens.length; inx++) {
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
      selfIssued: si
    }
    return validationResult;
  }

  /**
   * Check the token type based on the payload
   * @param validationOptions The options
   * @param token to check for type
   */
  private static getTokenType(_validationOptions: ValidationOptions, queueItem: ValidationQueueItem): [IValidationResponse, ClaimToken] {
    let validationResponse: IValidationResponse = {
      result: true,
      status: 200
    };

    const claimToken = queueItem.claimToken ?? ClaimToken.getTokenType(queueItem.tokenToValidate);
    return [validationResponse, claimToken];
    }

  /**
   * Set the validator options
   */
  private setValidatorOptions(): IValidatorOptions {
    const keyStore = new KeyStoreInMemory();
    const cryptoFactory = new CryptoFactoryNode(keyStore, SubtleCryptoNode.getSubtleCrypto());
    const payloadProtectionProtocol = new JoseProtocol();

    return {
      resolver: this.resolver,
      httpClient: {
        options: {}
      },
      crypto: {
        keyStore,
        cryptoFactory,
        payloadProtectionProtocol,
        payloadProtectionOptions: new CryptoOptions(cryptoFactory, payloadProtectionProtocol).payloadProtectionOptions
      }
    }
  }
}

