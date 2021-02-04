/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ErrorHelpers } from "../lib/error_handling/ErrorHelpers";

 describe('ErrorHelpers', () => {
  it('should return the correct error code', () => {
    expect(ErrorHelpers.errorCode('ABC', 5)).toEqual('ABC05');
  });
 });