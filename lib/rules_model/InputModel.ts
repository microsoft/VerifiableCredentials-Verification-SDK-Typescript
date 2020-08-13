/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BaseIssuanceModel } from './BaseIssuanceModel';

/**
 * Model for serializing Input
 */
export class InputModel extends BaseIssuanceModel {
  /**
   * Model id.
   */
  public id: string = "input";
  
  /**
   *
   * @param source IssuanceAttestationsModel instance to derive from
   */
  constructor (source: BaseIssuanceModel) {
    super(source.credentialIssuer, source.issuer, source.attestations?.forInput());
  }
}
