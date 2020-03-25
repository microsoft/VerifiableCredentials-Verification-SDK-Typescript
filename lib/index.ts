/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export { DidDocument, IDidDocument, IDidDocumentPublicKey, IDidDocumentServiceDescriptor, IDidResolver, IDidResolveResult, HttpResolver, HttpResolverOptions } from '@decentralized-identity/did-common-typescript';

import IValidatorOptions from './Options/IValidatorOptions';
import ValidationOptions from './Options/ValidationOptions';
import CryptoOptions, { ICryptoOptions } from './Options/CryptoOptions';
export { IValidatorOptions, ValidationOptions, ICryptoOptions, CryptoOptions };

import ClaimToken, { TokenType } from './VerifiableCredential/ClaimToken';
export { TokenType, ClaimToken };