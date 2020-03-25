/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export { DidDocument, IDidDocument, IDidDocumentPublicKey, IDidDocumentServiceDescriptor, IDidResolver, IDidResolveResult } from '@decentralized-identity/did-common-typescript';

import IValidatorOptions from './Options/IValidatorOptions';
import ValidationOptions from './Options/ValidationOptions';
import IExpected from './Options/IExpected';
import CryptoOptions, { ICryptoOptions } from './Options/CryptoOptions';
export { IValidatorOptions, ValidationOptions, ICryptoOptions, CryptoOptions, IExpected };

import ManagedHttpResolver from './resolver/ManagedHttpResolver';
export { ManagedHttpResolver };

import ClaimToken, { TokenType } from './VerifiableCredential/ClaimToken';
export { TokenType, ClaimToken };