/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import VerifiableCredentialConstants from './VerifiableCredentialConstants';

 /**
  * Model for the claim bag used by the verifiable credential issuance
  */
export default class ClaimBag {
  private _vcTypes: string[] = [VerifiableCredentialConstants.DEFAULT_VERIFIABLECREDENTIAL_TYPE];
  private _context: string[] = [VerifiableCredentialConstants.DEFAULT_VERIFIABLECREDENTIAL_CONTEXT];
  private _credentialStatus: any = undefined;

  /**
   * Claim used in CredentialSubject
   */
  public claims: { [prop: string]: any } = {};
  /**
   * Gets the type property
   */
  public get types(): string[] {
    return this._vcTypes;
  }

  /**
   * Gets the context property
   */
  public get context(): string[] {
    return this._context;
  }

  /**
   * Gets the credentialStatus property
   */
  public get credentialStatus(): any {
    return this._credentialStatus;
  }
  
  /**
   * sets the credentialStatus property
   */
  public set credentialStatus(value: any) {
    this._credentialStatus = value;
  }

  /**
   * Add or update a claim in the claim bag
   * @param type Claim type
   * @param values Claim value
   */
  public addOrUpdate(type: string, values: any) {
    this.claims[type] = values;
  }
}