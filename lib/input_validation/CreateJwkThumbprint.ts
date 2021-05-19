/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import base64url from 'base64url';
import { createHash } from 'crypto';

/**
 * for a given json web key calculate the thumbprint as defined by RFC 7638
 * @param jwk json web key instance
 * @returns thumbprint
 */
export function createJwkThumbprint(jwk: { [key: string]: string }): string {
  const key = {
    crv: jwk.crv,
    e: jwk.e,
    kty: jwk.kty,
    n: jwk.n,
    x: jwk.x,
    y: jwk.y,
  };

  const preimage = JSON.stringify(key);
  const digest = createHash('sha256').update(preimage, 'utf8').digest();
  return base64url(digest);
}
