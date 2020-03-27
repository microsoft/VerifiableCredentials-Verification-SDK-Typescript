/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ClaimToken, IExpected, IDidResolver, CryptoOptions, ITokenValidator } from '../index';
import { TokenType } from '../VerifiableCredential/ClaimToken';
import ValidationOptions from '../Options/ValidationOptions';
import IValidatorOptions from '../Options/IValidatorOptions';
import { KeyStoreInMemory, CryptoFactoryManager, CryptoFactoryNode, SubtleCryptoNode, JoseProtocol, JoseConstants } from '@microsoft/crypto-sdk';
import { IValidationResponse } from '../InputValidation/IValidationResponse';
import ValidationQueue from '../InputValidation/ValidationQueue';

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
    let options = new ValidationOptions(validatorOption, '');
    let validationResponse: IValidationResponse = {
      result: true,
      status: 200,
    };
    const queue = new ValidationQueue();
    queue.addToken(token);
    let queueItem = queue.getNextToken();
    do {
      let [response, claimToken] = Validator.getTokenType(options, queueItem!.token);
      const validator = this.tokenValidators[claimToken.type];
      if (!validator) {
        return new Promise((_, reject) => {
          reject(`${claimToken.type} does not has a TokenValidator`);
        });
      }
  
      switch (claimToken.type) {
        case TokenType.idToken: 
          options = new ValidationOptions(validatorOption, 'id token');
          response = await validator.validate(queue, queueItem!);
          break;
        case TokenType.verifiableCredential: 
          options = new ValidationOptions(validatorOption, 'verifiable credential');
          response = await validator.validate(queue, queueItem!);
          break;
        case TokenType.verifiablePresentation: 
          options = new ValidationOptions(validatorOption, 'verifiable presentation');
          response = await validator.validate(queue, queueItem!);
          break;
        default:
          return new Promise((_, reject) => {
            reject(`${claimToken.type} is not supported`);
          });
      }
      // Save result
      queueItem!.setResult(response);

      // Get next token to validate
      queueItem = queue.getNextToken();
    } while(queueItem);
    return queue.getResult();
  }
  
  private static getTokenType(validationOptions: ValidationOptions, token: string): [IValidationResponse, ClaimToken] {
    let validationResponse: IValidationResponse = {
      result: true,
      status: 200
    };

    // Deserialize id token token
    validationResponse = validationOptions.getTokenObjectDelegate(validationResponse, token);
    if (!validationResponse.result) {
      return [validationResponse, {} as ClaimToken];
    }

    // Check type of token
    if (validationResponse.payloadObject!.vc) {
      return [validationResponse, new ClaimToken(TokenType.verifiableCredential, token, '')];
    }
    if (validationResponse.payloadObject!.vp) {
      return [validationResponse, new ClaimToken(TokenType.verifiablePresentation, token, '')];
    }
    const signature = validationResponse.didSignature?.get(JoseConstants.tokenSignatures)[0];
    const header = signature.protected;
    if (header.has('alg') && header.get('alg') !== 'none') {
      return [validationResponse, new ClaimToken(TokenType.idToken, token, '')];
    } else {
      return [validationResponse, new ClaimToken(TokenType.selfIssued, token, '')];
    }
  }

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

