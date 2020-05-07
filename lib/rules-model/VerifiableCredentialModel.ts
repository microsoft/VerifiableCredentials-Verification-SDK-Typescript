  /*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Model for defining a Verifiable Credential
 */
export class VerifiableCredentialModel {
  /**
   * Verifiable credential contexts.
   */
  '@context': string[];

  constructor(context?: string[], public type?: string[], public credentialSubject?: any, public credentialStatus?: any, public credentialRefresh?: any) {
    if (context !== undefined) {
      this['@context'] = context;
    }
  }

  /**
   * Populate an instance of TrustedIssuerModel from any instance
   * @param input object instance to populate from
   */
  populateFrom(input: any): void {
    if (input['@context'] !== undefined) {
      const arr = Array.from(input['@context']);
      this['@context'] = arr.map(c => <string>c);
    }

    if (input.type !== undefined) {
      const arr = Array.from(input.type);
      this.type = arr.map(t => <string>t);
    }

    this.credentialSubject = input.credentialSubject;
    this.credentialStatus = input.credentialStatus;
    this.credentialRefresh = input.credentialRefresh;
  }
}
