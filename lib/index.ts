/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export { DidDocument, IDidDocument, IDidDocumentPublicKey, IDidDocumentServiceDescriptor, IDidResolver, IDidResolveResult } from '@decentralized-identity/did-common-typescript';

import IExpected from './Options/IExpected';
import CryptoOptions, { ICryptoOptions } from './Options/CryptoOptions';
export { ICryptoOptions, CryptoOptions, IExpected };

import ManagedHttpResolver from './Resolver/ManagedHttpResolver';
export { ManagedHttpResolver };

import ClaimToken, { TokenType } from './VerifiableCredential/ClaimToken';
export { TokenType, ClaimToken };

import ITokenValidator from './ApiValidation/ITokenValidator';
import IdTokenTokenValidator from './ApiValidation/IdTokenTokenValidator';
import VerifiableCredentialTokenValidator from './ApiValidation/VerifiableCredentialTokenValidator';
import VerifiablePresentationTokenValidator from './ApiValidation/VerifiablePresentationTokenValidator';
import Validator from './ApiValidation/Validator';
import IValidationResult from './ApiValidation/IValidationResult';
import ValidatorBuilder from './ApiValidation/ValidatorBuilder';
import SelfIssuedTokenValidator from './ApiValidation/SelfIssuedTokenValidator';
import SiopTokenValidator from './ApiValidation/SiopTokenValidator';
export { IValidationResult, SelfIssuedTokenValidator, SiopTokenValidator, VerifiablePresentationTokenValidator, VerifiableCredentialTokenValidator, IdTokenTokenValidator, Validator, ValidatorBuilder, ITokenValidator };

import { IValidationOptions } from './Options/IValidationOptions';
import IValidatorOptions from './Options/IValidatorOptions';
import ValidationOptions from './Options/ValidationOptions';
export { ValidationOptions, IValidationOptions, IValidatorOptions };

import TestSetup from '../tests/TestSetup';
import { IssuanceHelpers } from '../tests/IssuanceHelpers';
export { TestSetup, IssuanceHelpers  }

import { IdTokenValidationResponse } from './InputValidation/IdTokenValidationResponse';
import { IValidationResponse } from './InputValidation/IValidationResponse';
import { ISiopValidationResponse } from './InputValidation/SiopValidationResponse';
import { IdTokenValidation } from './InputValidation/IdTokenValidation';
import { VerifiablePresentationValidation } from './InputValidation/VerifiablePresentationValidation';
export { IValidationResponse, IdTokenValidationResponse, ISiopValidationResponse, IdTokenValidation, VerifiablePresentationValidation };

import IRevocedCard from './Revocation/IRevokedCard';
export { IRevocedCard };