/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TokenType } from '../index';

export default interface IExpected {
  type: TokenType,
  issuers: string[],
  audience: string,
  schemas?: string[]
}