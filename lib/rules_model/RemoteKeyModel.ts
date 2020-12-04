/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AuthenticationModel } from './AuthenticationModel';
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
   * @param authorization deprecated
   * @param authentication an object that describes how the to authenticate to the remote signer
   */
  constructor(
    public kid?: string,
    public key?: string,
    public x5t?: string,
    public pfx?: string,
    public extractable: boolean = false,
    public authorization?: RemoteKeyAuthorizationModel,
    public authentication?: AuthenticationModel,
  ) { }

  /**
   * Populate an instance of RemoteKeyAuthorizationModel from any instance
   * @param input object instance to populate from
   * @param authentication AuthenticationModel instance from the parent object
   */
  populateFrom(input: any, authentication?: AuthenticationModel): void {
    this.kid = input.kid;
    this.key = input.key;
    this.x5t = input.x5t;
    this.pfx = input.pfx;
    this.extractable = input.extractable;    

    if (input.authorization) {
      this.authorization = new RemoteKeyAuthorizationModel();
      this.authorization.populateFrom(input.authorization);
    }

    // the root authentication instance may be overridden
    this.authentication = input.authentication ? AuthenticationModel.fromJSON(input.authentication) : authentication;
  }
}
