/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IVerifiablePresentationStatus, ClaimToken, IDidResolver, ISiopValidationResponse, ITokenValidator, ValidatorBuilder, IValidatorOptions, IExpectedStatusReceipt, ValidationOptions, VerifiablePresentationStatusReceipt } from '../index';
import { IValidationResponse } from '../input_validation/IValidationResponse';
import ValidationQueue from '../input_validation/ValidationQueue';
import ValidationQueueItem from '../input_validation/ValidationQueueItem';
import { TokenType } from '../verifiable_credential/ClaimToken';
import IValidationResult from './IValidationResult';
import { KeyStoreOptions } from 'verifiablecredentials-crypto-sdk-typescript';
import { VerifiablePresentationValidationResponse } from '../input_validation/VerifiablePresentationValidationResponse';
import { v4 as uuid } from 'uuid';
import CorrelationId from '../tracing/CorrelationId';

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
  public async validate(token: string | ClaimToken): Promise<IValidationResponse> {
    let response: IValidationResponse = {
      result: true,
      status: 200,
    };
    let claimToken: ClaimToken;
    let siopDid: string | undefined;
    let siopContractId: string | undefined;
    const queue = new ValidationQueue();
    if (typeof token === 'string') {
      try {
        claimToken = ClaimToken.create(token);
      } catch (exception) {
        return {
          status: 400,
          detailedError: exception.message,
          result: false
        }
      }
    } else if (token instanceof ClaimToken) {
      claimToken = token;
    } else {
      return {
        result: false,
        status: 500,
        detailedError: 'Wrong token type. Expected string or ClaimToken'
      }
    }

    queue.enqueueToken('siop', claimToken);
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
          if (response.result) {
            claimToken = <ClaimToken>(<any>response.validationResult)?.idTokens;
          }
          break;
        case TokenType.verifiableCredential:
          response = await validator.validate(queue, queueItem!, siopDid!);
          if (response.result) {
            claimToken = <ClaimToken>(<any>response.validationResult)?.verifiableCredentials;
          }
          break;
        case TokenType.verifiablePresentationJwt:
          response = await validator.validate(queue, queueItem!, siopDid!);
          break;
        case TokenType.siopIssuance:
          response = await validator.validate(queue, queueItem!);
          siopDid = response.did;

          if (response.result) {
            siopContractId = Validator.readContractId(response.payloadObject.contract);
          }

          break;
        case TokenType.siop:
        case TokenType.siopPresentationAttestation:
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
    if (!response.result) {
      return response;
    }
    const validationResult = this.setValidationResult(queue);

    // Check if inputs are available
    response = this.validateAllRequiredInputs(validationResult);
    if (!response.result) {
      return response;
    }

    // Check status of VCs
    const statusResponse = await this.checkVcsStatus(validationResult);
    validationResult.verifiablePresentationStatus = statusResponse.validationResult?.verifiablePresentationStatus;

    if (statusResponse.result) {
      // set claims
      return {
        result: true,
        status: 200,
        validationResult
      };
    } else {
      return statusResponse;
    }
  }

  private validateAllRequiredInputs(validationResult: IValidationResult): IValidationResponse {
    // Check required VC's
    const requiredVCs = this.builder.trustedIssuersForVerifiableCredentials;
    if (requiredVCs) {
      for (let vc in requiredVCs) {
        const presentedVc = validationResult.verifiableCredentials && validationResult.verifiableCredentials[vc];
        if (!presentedVc) {
          return {
            detailedError: `Verifiable credential '${vc}' is missing from the input request`,
            status: 403,
            result: false
          };
        }
      }
    }

    // Check required id tokens
    const requiredidTokens = this.builder.trustedIssuerConfigurationsForIdTokens;
    if (requiredidTokens && (Object.keys(requiredidTokens).length !== 0 || requiredidTokens.length > 0)) {
      if (!validationResult.idTokens) {
        return {
          detailedError: `The id token is missing from the input request`,
          status: 403,
          result: false
        };
      }
    }

    return {
      result: true,
      status: 200,
      validationResult
    };
  }

  /**
   * Validate status on verifiable presentation
   */
  public async checkVcsStatus(validationResult: IValidationResult): Promise<IValidationResponse> {
    if (!this.builder.featureVerifiedCredentialsStatusCheckEnabled) {
      return {
        result: true,
        status: 200
      };
    }

    if (!validationResult.verifiablePresentations || !validationResult.verifiableCredentials) {
      return {
        result: true,
        status: 200
      };
    }

    const receipts: { [key: string]: IVerifiablePresentationStatus } = {};
    for (let vp in validationResult.verifiablePresentations) {
      const response = await this.checkVpStatus(validationResult.verifiablePresentations[vp]);
      if (!response.result) {
        return response;
      }

      if (response.validationResult?.verifiablePresentationStatus) {
        for (let id in response.validationResult.verifiablePresentationStatus) {
          receipts[id] = response.validationResult.verifiablePresentationStatus[id];
        }
      }
      console.log(`Status request for ${vp}, result: ${response.result} ===> ${validationResult.verifiablePresentations[vp]}`);
    }

    return {
      result: true,
      status: 200,
      validationResult: { verifiablePresentationStatus: receipts }
    };
  }

  /**
   * Validate status on verifiable presentation
   */
  public async checkVpStatus(verifiablePresentationToken: ClaimToken): Promise<VerifiablePresentationValidationResponse> {

    let validationResponse: VerifiablePresentationValidationResponse = {
      result: true,
      status: 200,
      validationResult: { verifiablePresentationStatus: <{ [key: string]: IVerifiablePresentationStatus }>{} }
    }

    //construct payload
    const publicKey = await (await this.builder.crypto.builder.keyStore.get(this.builder.crypto.builder.signingKeyReference!, new KeyStoreOptions({ publicKeyOnly: true }))).getKey<JsonWebKey>();
    const payload: any = {
      did: this.builder.crypto.builder.did,
      kid: `${this.builder.crypto.builder.did}#${this.builder.crypto.builder.signingKeyReference!.keyReference}`,
      vp: verifiablePresentationToken.rawToken,
      sub_jwk: publicKey,
      iss: 'https://self-issued.me',
      jti: uuid()
    };

    // get vcs to obtain status url
    const vcs = verifiablePresentationToken.decodedToken.vp?.verifiableCredential;
    if (vcs) {
      for (let vc in vcs) {
        const vcToValidate: any = ClaimToken.create(vcs[vc]);
        const statusUrl = vcToValidate.decodedToken?.vc?.credentialStatus?.id;
        const vcIssuerDid = vcToValidate.decodedToken.iss;

        if (statusUrl) {
          // send the payload
          payload.aud = statusUrl;
          const siop = await this.builder.crypto.signingProtocol('JOSE').sign(payload);
          const serialized = await siop.serialize();

          console.log(`verifiablePresentation status check on ${statusUrl} ====> ${serialized}`);

          this.builder.correlationId.increment();  
          let response = await fetch(statusUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain',
              'MS-CV': this.builder.correlationId.correlationId
            },
            body: serialized
          });
          if (!response.ok) {
            return {
              result: false,
              status: 403,
              detailedError: `status check could not fetch response from ${statusUrl} with status ${response.status}. Message ${JSON.stringify(await response.json())}`
            };
          }

          // Validate receipt
          const receipt = await response.json();
          const validatorOption: IValidatorOptions = this.setValidatorOptions();
          const options = new ValidationOptions(validatorOption, TokenType.siopPresentationExchange);
          const receiptValidator = new VerifiablePresentationStatusReceipt(receipt, this.builder, options, <IExpectedStatusReceipt>{ didIssuer: vcIssuerDid, didAudience: this.builder.crypto.builder.did });
          const receipts = await receiptValidator.validate();
          if (!receipts.result) {
            validationResponse = {
              result: false,
              status: 403,
              detailedError: receipts.detailedError
            };
            break;
          }

          for (let jti in receipts.validationResult?.verifiablePresentationStatus) {
            validationResponse.validationResult!.verifiablePresentationStatus![jti] = receipts.validationResult!.verifiablePresentationStatus[jti];
          }
        }
      }
    }

    return validationResponse;
  }

  /**
   * Set the validator options
   */
  private setValidatorOptions(): IValidatorOptions {
    return {
      correlationId:this.builder.correlationId,
      resolver: this.builder.resolver,
      crypto: this.builder.crypto
    }
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
      return (siop.validationResponse as ISiopValidationResponse).tokenId;
    })[0];

    const validationResult: IValidationResult = {
      did: did ? did : '',
      contract: contract ? contract : '',
      siopJti: jti ?? ''
    }

    // get id tokens
    let tokens = queue.items.filter((item) => item.validatedToken?.type === TokenType.idToken);
    if (tokens && tokens.length > 0) {
      validationResult.idTokens = {};
      for (let token in tokens) {
        const id = tokens[token].validatedToken?.id;
        validationResult.idTokens[id || token] = tokens[token].validatedToken!;
      }
    }

    // get verifiable credentials
    tokens = queue.items.filter((item) => item.validatedToken?.type === TokenType.verifiableCredential)
    if (tokens && tokens.length > 0) {
      validationResult.verifiableCredentials = {};
      for (let inx = 0; inx < tokens.length; inx++) {
        validationResult.verifiableCredentials[tokens[inx].validatedToken!.id] = tokens[inx].validatedToken!;
      }
    }

    // get verifiable presentations
    tokens = queue.items.filter((item) => item.validatedToken?.type === TokenType.verifiablePresentationJwt)
    if (tokens && tokens.length > 0) {
      validationResult.verifiablePresentations = {};
      for (let inx = 0; inx < tokens.length; inx++) {
        validationResult.verifiablePresentations[tokens[inx].id] = tokens[inx].validatedToken!;
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
    const claimToken = queueItem.tokenToValidate;
    return claimToken;
  }
}