/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ClaimToken, IDidResolver, ISiopValidationResponse, ITokenValidator, ValidatorBuilder } from '../index';
import { IValidationResponse } from '../input_validation/IValidationResponse';
import ValidationQueue from '../input_validation/ValidationQueue';
import ValidationQueueItem from '../input_validation/ValidationQueueItem';
import { TokenType } from '../verifiable_credential/ClaimToken';
import IValidationResult from './IValidationResult';
import { KeyStoreOptions } from 'verifiablecredentials-crypto-sdk-typescript';
import { VerifiablePresentationValidationResponse } from '../input_validation/VerifiablePresentationValidationResponse';

/**
 * Class model the token validator
 */
export default class Validator {

  private tokens: ClaimToken[] = [];

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
    let response: IValidationResponse = {
      result: true,
      status: 200,
    };
    let claimToken: ClaimToken;
    let siopDid: string | undefined;
    let siopContractId: string | undefined;
    const queue = new ValidationQueue();
    queue.enqueueToken('siop', token);
    let queueItem = queue.getNextToken();
    do {
      try {
        claimToken = Validator.getClaimToken(queueItem!);
      } catch (error) {
        return {
          detailedError: error.message,
          status: 400,
          result: false
        };
      }

      // keep track of the validated tokens
      this.tokens.push(claimToken);

      const validator = this.tokenValidators[claimToken.type];
      if (!validator) {
        return {
          detailedError: `${claimToken.type} does not has a TokenValidator`,
          status: 500,
          result: false
        };
      }

      switch (claimToken.type) {
        case TokenType.idToken:
          response = await validator.validate(queue, queueItem!, '', siopContractId);
          break;
        case TokenType.verifiableCredential:
          response = await validator.validate(queue, queueItem!, siopDid!);
          break;
        case TokenType.verifiablePresentation:
          response = await validator.validate(queue, queueItem!, siopDid!);
          break;
        case TokenType.siopIssuance:
          response = await validator.validate(queue, queueItem!);
          siopDid = response.did;

          if (response.result) {
            siopContractId = Validator.readContractId(response.payloadObject.contract);
          }

          break;
        case TokenType.siopPresentationAttestation:
          response = await validator.validate(queue, queueItem!);
          siopDid = response.did;
          break;
        case TokenType.siopPresentationExchange:
          response = await validator.validate(queue, queueItem!);
          siopDid = response.did;
          break;
        case TokenType.selfIssued:
          response = await validator.validate(queue, queueItem!);
          break;
        default:
          return {
            detailedError: `${claimToken.type} is not supported`,
            status: 400,
            result: false
          };
      }
      // Save result
      queueItem!.setResult(response, claimToken);

      // Get next token to validate
      queueItem = queue.getNextToken();
    } while (queueItem);

    // Set output
    response = queue.getResult();
    if (response.result) {
      const validationResult = this.setValidationResult(queue);

      // Check status of VCs

      // set claims
      response = {
        result: true,
        status: 200,
        validationResult
      };
    }
    return response;
  }

  /**
   * Validate status on verifiable presentation
   */
 // public async checkVcsStatus(validationResult: IValidationResult): Promise<IValidationResponse> {

  //}

  /**
   * Validate status on verifiable presentation
   */
  public async checkVpStatus(verifiablePresentationToken: ClaimToken): Promise<VerifiablePresentationValidationResponse> {

    //construct payload
    const publicKey = await (await this.builder.crypto.builder.keyStore.get(this.builder.crypto.builder.signingKeyReference, new KeyStoreOptions({ publicKeyOnly: true }))).getKey<JsonWebKey>();
    const payload: any = {
      did: this.builder.crypto.builder.did,
      kid: `${this.builder.crypto.builder.did}#${this.builder.crypto.builder.signingKeyReference}`,
      vp: verifiablePresentationToken,
      sub_jwk: publicKey
    };

    let validationResponse = {
      result: true,
      status: 200
    }

    // get vcs to obtain status url
    const vcs = verifiablePresentationToken.decodedToken.vp?.verifiableCredential;
    if (vcs) {
      for (let vc in vcs) {
        const vcToValidate: any = new ClaimToken(TokenType.verifiableCredential, vcs[vc], '');
        const statusUrl = vcToValidate.decodedToken.vc.credentialStatus && vcToValidate.decodedToken.vc.credentialStatus.id ?
          vcToValidate.decodedToken.vc.credentialStatus.id :
          undefined;

        if (statusUrl) {
          // send the payload
          const siop = await this.builder.crypto.signingProtocol.sign(Buffer.from(JSON.stringify(payload)));

          console.log(`verifiablePresentation status check`);
          let response = await fetch(statusUrl, {
            method: 'POST',
            body: siop.serialize()
          });
          const status = response.status;
          //const body = await response.body;
          //const text = await response.text();
          const json = await response.json();
          if (!response.ok) {
            return {
              result: false,
              status: 403,
              detailedError: `status check could not fetch response from ${statusUrl}`
            };
          }
        }
      }
    }

    return validationResponse;
  }

  private isSiop(type: TokenType | undefined) {
    return type === TokenType.siopIssuance || type === TokenType.siopPresentationAttestation
  }

  private setValidationResult(queue: ValidationQueue): IValidationResult {
    // get user DID from SIOP or VC
    let did = queue.items.filter((item) => this.isSiop(item.validatedToken?.type)).map((siop) => {
      return siop.validationResponse.did;
    })[0];
    if (!did) {
      did = queue.items.filter((item) => item.validatedToken?.type === TokenType.verifiableCredential).map((vc) => {
        return vc.validatedToken?.decodedToken.aud;
      })[0];
    }

    // Set the contract
    const contract = queue.items.filter((item) => this.isSiop(item.validatedToken?.type)).map((siop) => {
      return (siop.validationResponse as ISiopValidationResponse).payloadObject.contract;
    })[0];

    // Set the jti
    const jti = queue.items.filter((item) => this.isSiop(item.validatedToken?.type)).map((siop) => {
      return (siop.validationResponse as ISiopValidationResponse).payloadObject.jti;
    })[0];

    const validationResult: IValidationResult = {
      did: did ? did : '',
      contract: contract ? contract : '',
      siopJti: jti ?? ''
    }

    // get id tokens
    let tokens = queue.items.filter((item) => item.validatedToken?.type === TokenType.idToken)
    if (tokens && tokens.length > 0) {
      validationResult.idTokens = tokens.map((token: any) => token.validatedToken);
    }

    // get verifiable credentials
    tokens = queue.items.filter((item) => item.validatedToken?.type === TokenType.verifiableCredential)
    if (tokens && tokens.length > 0) {
      validationResult.verifiableCredentials = {};
      for (let inx = 0; inx < tokens.length; inx++) {
        validationResult.verifiableCredentials[tokens[inx].id] = tokens[inx].validatedToken;
      }
    }

    // get verifiable presentations
    tokens = queue.items.filter((item) => item.validatedToken?.type === TokenType.verifiablePresentation)
    if (tokens && tokens.length > 0) {
      validationResult.verifiablePresentations = {};
      for (let inx = 0; inx < tokens.length; inx++) {
        validationResult.verifiablePresentations[tokens[inx].id] = tokens[inx].validatedToken;
      }
    }

    // get self issued
    tokens = queue.items.filter((item) => item.validatedToken?.type === TokenType.selfIssued);
    if (tokens && tokens.length > 0) {
      validationResult.selfIssued = tokens[0].validatedToken;
    }

    // get siop
    tokens = queue.items.filter((item) => this.isSiop(item.validatedToken?.type));
    if (tokens && tokens.length > 0) {
      validationResult.siop = tokens[0].validatedToken;
    }
    return validationResult;
  }

  /**
   * for a given contract uri, get the id
   * @param contractUrl the contract uri to extract the name from
   * */
  public static readContractId(contractUrl: string) {
    const url = new URL(contractUrl);
    let path = url.pathname;

    const pathParts = path.split('/');
    path = pathParts[pathParts.length - 1];
    return decodeURIComponent(path);
  }


  /**
   * Check the token type based on the payload
   * @param validationOptions The options
   * @param token to check for type
   */
  private static getClaimToken(queueItem: ValidationQueueItem): ClaimToken {
    const claimToken = queueItem.claimToken ?? ClaimToken.create(queueItem.tokenToValidate);
    return claimToken;
  }
}