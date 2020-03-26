/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenValidator, ClaimToken, IExpected, IDidResolver, CryptoOptions } from '../index';
import { TokenType } from '../VerifiableCredential/ClaimToken';
import { IdTokenValidation } from '../InputValidation/IdTokenValidation';
import ValidationOptions from '../Options/ValidationOptions';
import { IValidationOptions } from '../Options/IValidationOptions';
import IValidatorOptions from '../Options/IValidatorOptions';
import { KeyStoreInMemory, CryptoFactoryManager, CryptoFactoryNode, SubtleCryptoNode, JoseProtocol, JoseConstants } from '@microsoft/crypto-sdk';
import { IValidationResponse } from '../InputValidation/IValidationResponse';

/**
 * Class model the token validator
 */
export default class Validator {

  constructor(
    private _tokenValidators: { [type: string]: TokenValidator },
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
  public get tokenValidators(): { [type: string]: TokenValidator } {
    return this._tokenValidators;
  }

  public async validate(token: string, expected: IExpected): Promise<IValidationResponse> {
    const validatorOption: IValidatorOptions = this.setValidatorOptions();
    let options = new ValidationOptions(validatorOption, '');
    const [validationResponse, claimToken] = Validator.getTokenType(options, token);
    switch (claimToken.type) {
      case TokenType.idToken: 
        options = new ValidationOptions(validatorOption, 'id token');
        return this.idTokenValidate(validatorOption, claimToken, expected);
      default:
        return new Promise((_, reject) => {
          reject(`${claimToken.type} is not supported`);
        });
    }
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

  private async idTokenValidate(validatorOption: IValidatorOptions, token: ClaimToken, expected: IExpected): Promise<IValidationResponse> {
    const options = new ValidationOptions(validatorOption, 'id token');
    const validator = new IdTokenValidation(options, expected);
    const validationResult = await validator.validate(token);
    return validationResult as IValidationResponse;
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

