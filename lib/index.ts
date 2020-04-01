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

import ITokenValidator from './Api/ITokenValidator';
import IdTokenTokenValidator from './Api/IdTokenTokenValidator';
import VerifiableCredentialTokenValidator from './Api/VerifiableCredentialTokenValidator';
import VerifiablePresentationTokenValidator from './Api/VerifiablePresentationTokenValidator';
import Validator from './Api/Validator';
import ValidatorBuilder from './Api/ValidatorBuilder';
import SelfIssuedTokenValidator from './Api/SelfIssuedTokenValidator';
import SiopTokenValidator from './Api/SiopTokenValidator';
export { SelfIssuedTokenValidator, SiopTokenValidator, VerifiablePresentationTokenValidator, VerifiableCredentialTokenValidator, IdTokenTokenValidator, Validator, ValidatorBuilder, ITokenValidator };

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