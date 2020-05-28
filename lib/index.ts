/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export { DidDocument, IDidDocument, IDidDocumentPublicKey, IDidDocumentServiceDescriptor, IDidResolver, IDidResolveResult } from '@decentralized-identity/did-common-typescript';

import {IExpectedBase, IExpectedSiop, IExpectedVerifiablePresentation, IExpectedVerifiableCredential, IExpectedSelfIssued, IExpectedIdToken, IExpectedOpenIdToken, IExpectedAudience} from './Options/IExpected';
export { IExpectedBase, IExpectedSiop, IExpectedVerifiablePresentation, IExpectedVerifiableCredential, IExpectedSelfIssued, IExpectedIdToken, IExpectedOpenIdToken, IExpectedAudience };

import ManagedHttpResolver from './Resolver/ManagedHttpResolver';
export { ManagedHttpResolver };

import ClaimToken, { TokenType } from './VerifiableCredential/ClaimToken';
export { TokenType, ClaimToken };

import TokenValidatorsBuilder from './ApiValidation/TokenValidatorsBuilder';
import ITokenValidator from './ApiValidation/ITokenValidator';
import IdTokenTokenValidator from './ApiValidation/IdTokenTokenValidator';
import VerifiableCredentialTokenValidator from './ApiValidation/VerifiableCredentialTokenValidator';
import VerifiablePresentationTokenValidator from './ApiValidation/VerifiablePresentationTokenValidator';
import Validator from './ApiValidation/Validator';
import IValidationResult from './ApiValidation/IValidationResult';
import ValidatorBuilder from './ApiValidation/ValidatorBuilder';
import SelfIssuedTokenValidator from './ApiValidation/SelfIssuedTokenValidator';
import SiopTokenValidator from './ApiValidation/SiopTokenValidator';
export { TokenValidatorsBuilder, IValidationResult, SelfIssuedTokenValidator, SiopTokenValidator, VerifiablePresentationTokenValidator, VerifiableCredentialTokenValidator, IdTokenTokenValidator, Validator, ValidatorBuilder, ITokenValidator };

import { IValidationOptions } from './Options/IValidationOptions';
import IValidatorOptions from './Options/IValidatorOptions';
import ValidationOptions from './Options/ValidationOptions';
import BasicValidatorOptions from './Options/BasicValidatorOptions';
export { ValidationOptions, IValidationOptions, IValidatorOptions, BasicValidatorOptions };

import TestSetup from '../tests/TestSetup';
import { IssuanceHelpers } from '../tests/IssuanceHelpers';
export { TestSetup, IssuanceHelpers  }

import { IdTokenValidationResponse } from './InputValidation/IdTokenValidationResponse';
import { IValidationResponse } from './InputValidation/IValidationResponse';
import { ISiopValidationResponse } from './InputValidation/SiopValidationResponse';
import { IdTokenValidation } from './InputValidation/IdTokenValidation';
import { BaseIdTokenValidation } from './InputValidation/BaseIdTokenValidation';
import { OpenIdTokenValidation } from './InputValidation/OpenIdTokenValidation';
import { VerifiablePresentationValidation } from './InputValidation/VerifiablePresentationValidation';
import { DidValidation } from './InputValidation/DidValidation'
import { SiopValidation } from './InputValidation/SiopValidation'
import { VerifiableCredentialValidation } from './InputValidation/VerifiableCredentialValidation'
export { IValidationResponse, IdTokenValidationResponse, ISiopValidationResponse, IdTokenValidation, VerifiablePresentationValidation, DidValidation, SiopValidation, VerifiableCredentialValidation, BaseIdTokenValidation, OpenIdTokenValidation };

import IRevocedCard from './Revocation/IRevokedCard';
export { IRevocedCard };

import { IResponse } from './InputValidation/IValidationResponse';
import RequestorBuilder from './ApiOidcRequest/RequestorBuilder';
import Requestor from './ApiOidcRequest/Requestor';
export { IResponse, RequestorBuilder, Requestor };

import Crypto from './ApiCrypto/Crypto';
import CryptoBuilder from './ApiCrypto/CryptoBuilder';
import { SubtleCrypto } from 'verifiablecredentials-crypto-sdk-typescript';
export { Crypto, CryptoBuilder, SubtleCrypto };

import { BaseAttestationModel } from './rules-model/BaseAttestationModel';
import { BaseIssuanceModel } from './rules-model/BaseIssuanceModel';
import { IdTokenAttestationModel } from './rules-model/IdTokenAttestationModel';
import { InputClaimModel } from './rules-model/InputClaimModel';
import { InputModel } from './rules-model/InputModel';
import { IssuanceAttestationsModel } from './rules-model/IssuanceAttestationsModel';
import { RemoteKeyAuthorizationModel } from './rules-model/RemoteKeyAuthorizationModel';
import { RemoteKeyModel } from './rules-model/RemoteKeyModel';
import { RulesModel } from './rules-model/RulesModel';
import { SelfIssuedAttestationModel } from './rules-model/SelfIssuedAttestationModel';
import { TrustedIssuerModel } from './rules-model/TrustedIssuerModel';
import { VerifiablePresentationAttestationModel } from './rules-model/VerifiablePresentationAttestationModel';
import { RefreshConfigurationModel } from './rules-model/RefreshConfigurationModel';
import { VerifiableCredentialModel } from './rules-model/VerifiableCredentialModel';
import { TransformModel } from './rules-model/TransformModel'; 
export {
  TransformModel,
  VerifiableCredentialModel,
  RefreshConfigurationModel,
  BaseAttestationModel,
  BaseIssuanceModel,
  IdTokenAttestationModel,
  InputClaimModel,
  InputModel,
  IssuanceAttestationsModel,
  RemoteKeyAuthorizationModel,
  RemoteKeyModel,
  RulesModel,
  SelfIssuedAttestationModel,
  TrustedIssuerModel,
  VerifiablePresentationAttestationModel
};

import LongFormDid from './ApiCrypto/LongFormDid';
export { LongFormDid };