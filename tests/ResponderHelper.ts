/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRequestorPresentationExchange, PresentationDefinitionModel, InputDescriptorModel, PresentationExchangeIssuanceModel, PresentationExchangeSchemaModel, RequestorBuilder, CryptoBuilder, KeyReference } from '../lib/index';
import RequestorHelper from './RequestorHelper'

export default class ResponderHelper {
    constructor(public responder: RequestorHelper) {
    }
    
    public crypto = new CryptoBuilder()
        .useSigningKeyReference(new KeyReference('signing'))
        .useRecoveryKeyReference(new KeyReference('recovery'))
        .build();

}