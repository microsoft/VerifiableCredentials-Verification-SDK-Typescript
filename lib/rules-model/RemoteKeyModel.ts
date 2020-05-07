/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RemoteKeyAuthorizationModel } from './RemoteKeyAuthorizationModel';

/**
 * Model to express a Remote Key
 */
export class RemoteKeyModel {
  /**
   *
   * @param kid analog to the JOSE key id parameter which may be used to identify an arbitrary key
   * @param key url to a remote private key which may execute a decrypt/sign operation
   * @param x5t the thumbprint of a certificate identifying the public key counterpart of the private key
   * @param pfx url instructing the issuer about where to obtain a PKCS 12 to obtain the private key for a decrypt/sign operation
   * @param extractable flag indicating if the remote key is extractable
   * @param authorization an object that describes how the Issue API will authorize to the remote key
   */
  constructor(
    public kid?: string,
    public key?: string,
    public x5t?: string,
    public pfx?: string,
    public extractable: boolean = false,
    public authorization?: RemoteKeyAuthorizationModel
  ) {}

  /**
   * Populate an instance of RemoteKeyAuthorizationModel from any instance
   * @param input object instance to populate from
   */
  populateFrom(input: any): void {
    this.kid = input.kid;
    this.key = input.key;
    this.x5t = input.x5t;
    this.pfx = input.pfx;
    this.extractable = input.extractable;
    this.authorization = new RemoteKeyAuthorizationModel();
    this.authorization.populateFrom(input.authorization);
  }
}
