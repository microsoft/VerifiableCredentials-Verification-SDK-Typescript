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

import TokenValidator from './Api/TokenValidator';
import Validator from './Api/Validator';
import ValidatorBuilder from './Api/ValidatorBuilder';
export { TokenValidator, Validator, ValidatorBuilder };
