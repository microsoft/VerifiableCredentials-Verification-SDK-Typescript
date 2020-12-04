/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export { DidDocument, IDidDocument, IDidDocumentPublicKey, IDidDocumentServiceDescriptor, IDidResolver, IDidResolveResult } from '@decentralized-identity/did-common-typescript';

import {IExpectedStatusReceipt, IExpectedBase, IExpectedSiop, IExpectedVerifiablePresentation, IExpectedVerifiableCredential, IExpectedSelfIssued, IExpectedIdToken, IExpectedOpenIdToken, IExpectedAudience, IssuerMap} from './options/IExpected';
export { IExpectedStatusReceipt, IExpectedBase, IExpectedSiop, IExpectedVerifiablePresentation, IExpectedVerifiableCredential, IExpectedSelfIssued, IExpectedIdToken, IExpectedOpenIdToken, IExpectedAudience, IssuerMap };

import { RulesValidationError } from './error_handling/RulesValidationError';
export { RulesValidationError };

import ManagedHttpResolver from './resolver/ManagedHttpResolver';
export { ManagedHttpResolver };

import ClaimToken, { TokenType } from './verifiable_credential/ClaimToken';
export { TokenType, ClaimToken };

import ITokenValidator from './api_validation/ITokenValidator';
import IdTokenTokenValidator from './api_validation/IdTokenTokenValidator';
import VerifiableCredentialTokenValidator from './api_validation/VerifiableCredentialTokenValidator';
import VerifiablePresentationTokenValidator from './api_validation/VerifiablePresentationTokenValidator';
import Validator from './api_validation/Validator';
import IValidationResult from './api_validation/IValidationResult';
import ValidatorBuilder from './api_validation/ValidatorBuilder';
import SelfIssuedTokenValidator from './api_validation/SelfIssuedTokenValidator';
import SiopTokenValidator from './api_validation/SiopTokenValidator';
export { IValidationResult, SelfIssuedTokenValidator, SiopTokenValidator, VerifiablePresentationTokenValidator, VerifiableCredentialTokenValidator, IdTokenTokenValidator, Validator, ValidatorBuilder, ITokenValidator };

import { IValidationOptions } from './options/IValidationOptions';
import IValidatorOptions from './options/IValidatorOptions';
import ValidationOptions from './options/ValidationOptions';
import BasicValidatorOptions from './options/BasicValidatorOptions';
export { ValidationOptions, IValidationOptions, IValidatorOptions, BasicValidatorOptions };

import TestSetup from '../tests/TestSetup';
import { IssuanceHelpers } from '../tests/IssuanceHelpers';
//import RequestorHelper from '../tests/RequestorHelper';
//import ResponderHelper from '../tests/ResponderHelper';
//import TokenGenerator from '../tests/TokenGenerator';
export { TestSetup, IssuanceHelpers }

import { IdTokenValidationResponse } from './input_validation/IdTokenValidationResponse';
import { IValidationResponse } from './input_validation/IValidationResponse';
import { ISiopValidationResponse } from './input_validation/SiopValidationResponse';
import { IdTokenValidation } from './input_validation/IdTokenValidation';
import { BaseIdTokenValidation } from './input_validation/BaseIdTokenValidation';
import { OpenIdTokenValidation } from './input_validation/OpenIdTokenValidation';
import { VerifiablePresentationValidation } from './input_validation/VerifiablePresentationValidation';
import { DidValidation } from './input_validation/DidValidation'
import { SiopValidation } from './input_validation/SiopValidation'
import { VerifiableCredentialValidation } from './input_validation/VerifiableCredentialValidation';
import VerifiablePresentationStatusReceipt, { IVerifiablePresentationStatus }  from './api_validation/VerifiablePresentationStatusReceipt';
export { VerifiablePresentationStatusReceipt, IVerifiablePresentationStatus, IValidationResponse, IdTokenValidationResponse, ISiopValidationResponse, IdTokenValidation, VerifiablePresentationValidation, DidValidation, SiopValidation, VerifiableCredentialValidation, BaseIdTokenValidation, OpenIdTokenValidation };

import IRevocedCard from './revocation/IRevokedCard';
export { IRevocedCard };

import { IResponse } from './input_validation/IValidationResponse';
import RequestorBuilder, { PresentationProtocol } from './api_oidc_request/RequestorBuilder';
import Requestor from './api_oidc_request/Requestor';
import IRequestor from './api_oidc_request/IRequestor';
import IRequestorAttestation from './api_oidc_request/IRequestorAttestation';
import IRequestorPresentationExchange from './api_oidc_request/IRequestorPresentationExchange';
export { PresentationProtocol, IResponse, RequestorBuilder, Requestor, IRequestor, IRequestorAttestation, IRequestorPresentationExchange };

export { KeyStoreFactory, SubtleCryptoNode, CryptoFactoryManager, CryptographicKey, KeyType, KeyUse, JoseBuilder, IPayloadProtectionSigning, LongFormDid, Subtle, Crypto, CryptoBuilder, IKeyContainer, IKeyStore, KeyReference, CryptoFactory } from 'verifiablecredentials-crypto-sdk-typescript';

import { AuthenticationModel } from './rules_model/AuthenticationModel';
import { AuthenticationScheme } from './rules_model/AuthenticationModel';
import { BaseAttestationModel } from './rules_model/BaseAttestationModel';
import { BaseIssuanceModel } from './rules_model/BaseIssuanceModel';
import { DataProviderHeaders } from './rules_model/DataProviderModel';
import { DataProviderModel } from './rules_model/DataProviderModel';
import { EventBindingModel } from './rules_model/EventBindingModel';
import { IdTokenAttestationModel } from './rules_model/IdTokenAttestationModel';
import { InputClaimModel } from './rules_model/InputClaimModel';
import { InputModel } from './rules_model/InputModel';
import { IssuanceAttestationsModel } from './rules_model/IssuanceAttestationsModel';
import { RemoteKeyAuthorizationModel } from './rules_model/RemoteKeyAuthorizationModel';
import { RemoteKeyModel } from './rules_model/RemoteKeyModel';
import { RulesModel } from './rules_model/RulesModel';
import { RulesPermissionModel } from './rules_model/RulesPermissionModel';
import { SelfIssuedAttestationModel } from './rules_model/SelfIssuedAttestationModel';
import { TrustedIssuerModel } from './rules_model/TrustedIssuerModel';
import { VerifiablePresentationAttestationModel } from './rules_model/VerifiablePresentationAttestationModel';
import { RefreshConfigurationModel } from './rules_model/RefreshConfigurationModel';
import { VerifiableCredentialModel } from './rules_model/VerifiableCredentialModel';
import { TransformModel } from './rules_model/TransformModel'; 
import { PresentationDefinitionModel } from './rules_model/presentation_exchange/PresentationDefinitionModel'; 
import { PresentationExchangeInputDescriptorModel } from './rules_model/presentation_exchange/PresentationExchangeInputDescriptorModel'; 
import { PresentationExchangeSchemaModel } from './rules_model/presentation_exchange/PresentationExchangeSchemaModel'; 
import { PresentationExchangeIssuanceModel } from './rules_model/presentation_exchange/PresentationExchangeIssuanceModel'; 
import { PresentationExchangeConstraintsModel } from './rules_model/presentation_exchange/PresentationExchangeConstraintsModel'; 
export {
  AuthenticationModel,
  AuthenticationScheme,
  DataProviderHeaders,
  DataProviderModel,
  EventBindingModel,
  PresentationDefinitionModel,
  PresentationExchangeInputDescriptorModel,
  PresentationExchangeSchemaModel,
  PresentationExchangeIssuanceModel,
  PresentationExchangeConstraintsModel,
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
  RulesPermissionModel,
  SelfIssuedAttestationModel,
  TrustedIssuerModel,
  VerifiablePresentationAttestationModel
};
