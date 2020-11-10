/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CryptoBuilder, KeyReference, LongFormDid, KeyUse, TokenType, ClaimToken, JoseBuilder } from '../lib/index';
import RequestorHelper from './RequestorHelper'
import TokenGenerator from './TokenGenerator';
import ITestModel from './models/ITestModel';
import { v4 as uuidv4 } from 'uuid';
const jp = require('jsonpath');
const clone = require('clone');

export default class ResponderHelper {
  constructor(public requestor: RequestorHelper, public responseDefinition: ITestModel) {
  }

  public crypto = new CryptoBuilder()
    .useSigningKeyReference(new KeyReference('signingResponder'))
    .useRecoveryKeyReference(new KeyReference('recovery'))
    .build();

  public vcPayload = {
    givenName: 'Jules',
    familyName: 'Winnfield'
  };

  public generator = new TokenGenerator(this);

  public async setup(signingProtocol: string = 'ES256K'): Promise<void> {
    this.crypto.builder.useSigningAlgorithm(signingProtocol);
    this.crypto.builder.useRecoveryAlgorithm(signingProtocol);
    this.crypto = await this.crypto.generateKey(KeyUse.Signature, 'signing');
    this.crypto = await this.crypto.generateKey(KeyUse.Signature, 'recovery');
    let did = await (new LongFormDid(this.crypto)).serialize();
    this.crypto.builder.useDid(did);

    // setup mock so requestor can resolve this did
    TokenGenerator.mockResolver(this.crypto);

    await this.generator.setup(signingProtocol);
  }

  public async createResponse(vcProtocol: string = JoseBuilder.JWT): Promise<ClaimToken> {

    await this.generator.setVcsInPresentations(vcProtocol);
    const payload = this.responseDefinition.response;

    // Present the VCs
    const presentations = (<ITestModel>this.responseDefinition).getPresentationsFromModel();
    if (presentations) {
      for (let presentation in presentations) {
        const jti = uuidv4();
        const vcs: ClaimToken = presentations[presentation];

        // Set status mock
        const statusReceipts: any = {
          receipt: {
          }
        };

        // Set id as jti
        this.responseDefinition.responseStatus[presentation].credentialStatus.id = jti;

        // Set aud
        this.responseDefinition.responseStatus[presentation].aud = this.requestor.crypto.builder.did;

        // Set iss
        this.responseDefinition.responseStatus[presentation].iss = this.generator.crypto.builder.did;

        // Sign the receipts
        await this.generator.crypto.signingProtocol(JoseBuilder.JWT).sign(this.responseDefinition.responseStatus[presentation]);
        statusReceipts.receipt[jti] = await this.generator.crypto.signingProtocol(JoseBuilder.JWT).serialize();

        const statusUrl = vcs.decodedToken.vc?.credentialStatus?.id || vcs.decodedToken.verifiableCredential?.credentialStatus?.id;
        TokenGenerator.fetchMock.post(statusUrl, statusReceipts, { overwriteRoutes: true });
        console.log(`Set mock for ${statusUrl}`);

        let vpPayload: any;

        if (vcProtocol === JoseBuilder.JSONLDProofs) {
          const vc = clone(presentations[presentation].decodedToken);
          presentations[presentation] = {
            verifiableCredential: vc
          }
        } else {
          vpPayload = {
            jti,
            vp: {
              '\@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://www.w3.org/2018/credentials/examples/v1'
              ],
              type: ['VerifiablePresentation'],
              verifiableCredential: [vcs.rawToken],
            },
            sub: `${this.requestor.crypto.builder.did}`,
            iss: `${this.crypto.builder.did}`,
            aud: `${this.requestor.crypto.builder.did}`
          };

          // Sign
          await this.crypto.signingProtocol(JoseBuilder.JWT).sign(vpPayload);
          presentations[presentation] = await this.crypto.signingProtocol(JoseBuilder.JWT).serialize();
        }
      }
    }

    // Present the id tokens
    await this.generator.setIdTokens();

    // Add VCs without presentation


    // Check for any payload operations
    if (this.responseDefinition.responseOperations) {
      for (let inx in this.responseDefinition.responseOperations) {
        jp.apply(payload, this.responseDefinition!.responseOperations![inx].path, this.responseDefinition!.responseOperations![inx].operation);
      }
    }

    const token = await (await this.crypto.signingProtocol(JoseBuilder.JWT).sign(payload)).serialize();
    return new ClaimToken(TokenType.siopPresentationAttestation, token);
  }

}