/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { IValidationResponse } from '../lib/input_validation/IValidationResponse';
import base64url from 'base64url';
import { IPayloadProtectionSigning, JoseBuilder } from 'verifiablecredentials-crypto-sdk-typescript';
import ValidationOptions from '../lib/options/ValidationOptions';
import { IssuanceHelpers } from './IssuanceHelpers';
import ClaimToken, { TokenType } from '../lib/verifiable_credential/ClaimToken';
import { IExpectedAudience, IdTokenValidationResponse, ValidatorBuilder } from '../lib';

describe('ValidationHelpers', () => {
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
  });

  afterEach(() => {
    setup.fetchMock.reset();
  });

  it('should test getTokenObject', async () => {
    let [request, options, siopRequest] = await IssuanceHelpers.createRequest(setup, TokenType.verifiableCredential, true);
    const validationResponse: IValidationResponse = {
      status: 200,
      result: true
    }
    let response = await options.getTokenObjectDelegate(validationResponse, <string>request.rawToken);
    expect(response.result).toBeTruthy();
    expect(response.status).toEqual(200);

    // negative cases
    // malformed token
    let splitToken = (<string>request.rawToken).split('.');
    response = await options.getTokenObjectDelegate(validationResponse, splitToken[0]);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('The verifiableCredential could not be deserialized');
    expect(response.code).toEqual('VCSDKVaHe01');

    // missing kid
    const header: any = JSON.parse(base64url.decode(splitToken[0]));
    header.kid = '';
    response = await options.getTokenObjectDelegate(validationResponse, `${base64url.encode(JSON.stringify(header))}.${splitToken[1]}.${splitToken[2]}`);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('The protected header in the verifiableCredential does not contain the kid');
    expect(response.code).toEqual('VCSDKVaHe05');


    // bad JWT deserialize 
    let protocol = options.validatorOptions.crypto.signingProtocol(JoseBuilder.JWT);
    let deserializeSpy = spyOn(protocol, 'deserialize').and.callFake(() => <any>{});
    response = await options.getTokenObjectDelegate(validationResponse, '');
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('The payload in the verifiableCredential is undefined');
    expect(response.code).toEqual('VCSDKVaHe03');

    protocol = options.validatorOptions.crypto.signingProtocol(JoseBuilder.JWT);
    deserializeSpy.and.callFake(() => <any>undefined);
    response = await options.getTokenObjectDelegate(validationResponse, '');
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('The signature in the verifiableCredential has an invalid format');
    expect(response.code).toEqual('VCSDKVaHe02');

    deserializeSpy.and.callFake(() => { throw new Error('deserialize JWT error') });
    response = await options.getTokenObjectDelegate(validationResponse, '');
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('The verifiableCredential could not be deserialized');
    expect(response.code).toEqual('VCSDKVaHe01');

    // bad json ld deserialize 
    protocol = options.validatorOptions.crypto.signingProtocol(JoseBuilder.JSONLDProofs);
    deserializeSpy = spyOn(protocol, 'deserialize').and.callFake(() => { throw new Error('deserialize error') });
    response = await options.getTokenObjectDelegate(validationResponse, {});
    expect(response.result).toBeFalsy(response.detailedError);
    expect(response.detailedError).toEqual('The verifiableCredential could not be deserialized');
    expect(response.code).toEqual('VCSDKVaHe01');
    deserializeSpy.and.callFake(() => <any>{});
  });

  it('should test resolveDid', async () => {
    let [request, options, siopRequest] = await IssuanceHelpers.createRequest(setup, TokenType.verifiableCredential, true);
    const validationResponse: IValidationResponse = {
      status: 200,
      result: true,
      did: setup.defaultUserDid,
      didKid: setup.defaulUserDidKid
    };
    let response = await options.resolveDidAndGetKeysDelegate(validationResponse);
    expect(response.result).toBeTruthy();
    expect(response.status).toEqual(200);

    // negative cases
    // No kid
    validationResponse.didKid = undefined;
    response = await options.resolveDidAndGetKeysDelegate(validationResponse);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('The kid is not referenced in the request');
    expect(response.code).toEqual('VCSDKVaHe10');
    validationResponse.didKid = setup.defaulUserDidKid;

    // No public key
    validationResponse.didKid = 'abcd';
    response = await options.resolveDidAndGetKeysDelegate(validationResponse);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`The did 'did:test:user' does not have a public key with kid 'abcd'. Public key : 'undefined'`);
    expect(response.code).toEqual('VCSDKVaHe11');
    validationResponse.didKid = setup.defaulUserDidKid;

    // No did document
    setup.fetchMock.get(`${setup.resolverUrl}/${setup.defaultUserDid}`, {}, { overwriteRoutes: true });
    response = await options.resolveDidAndGetKeysDelegate(validationResponse);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);

    const resolveSpy = spyOn(options.validatorOptions.resolver, "resolve").and.callFake(() => { return <any>undefined });
    response = await options.resolveDidAndGetKeysDelegate(validationResponse);
    expect(response.result).toBeFalsy();
    expect(response.detailedError).toEqual(`Could not retrieve DID document 'did:test:user'`);
    expect(response.code).toEqual('VCSDKVaHe08');
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);

  });

  it('should not resolve resolveDid', async () => {
    let [request, options, siopRequest] = await IssuanceHelpers.createRequest(setup, TokenType.verifiableCredential, true);
    const validationResponse: IValidationResponse = {
      status: 200,
      result: true
    };
    validationResponse.did = 'didJules';
    setup.fetchMock.get(`${setup.resolverUrl}/${validationResponse.did}`, { status: 404 }, { overwriteRoutes: true });
    const response = await options.resolveDidAndGetKeysDelegate(validationResponse);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Could not resolve DID 'didJules'`);
    expect(response.code).toEqual('VCSDKVaHe09');

  });

  it('should test validateDidSignatureDelegate', async () => {
    let [request, options, siopRequest] = await IssuanceHelpers.createRequest(setup, TokenType.verifiableCredential, true);
    let validationResponse: IValidationResponse = {
      status: 200,
      result: true,
      did: setup.defaultUserDid
    };
    validationResponse = await options.getTokenObjectDelegate(validationResponse, <string>request.rawToken);
    validationResponse.didSigningPublicKey = siopRequest.didJwkPublic;
    const token = validationResponse.didSignature as IPayloadProtectionSigning;
    let response = await options.validateDidSignatureDelegate(validationResponse, token);
    expect(response.result).toBeTruthy();
    expect(response.status).toEqual(200);

    // negative cases
    // Bad signature
    validationResponse = await options.getTokenObjectDelegate(validationResponse, <string>request.rawToken + 1);
    response = await options.validateDidSignatureDelegate(validationResponse, validationResponse.didSignature as IPayloadProtectionSigning);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('The signature on the payload in the verifiableCredential is invalid');
    expect(response.code).toEqual('VCSDKVaHe27');

    // No signature
    const splitToken = (<string>request.rawToken).split('.');
    validationResponse = await options.getTokenObjectDelegate(validationResponse, `${splitToken[0]}.${splitToken[1]}`);
    response = await options.validateDidSignatureDelegate(validationResponse, validationResponse.didSignature as IPayloadProtectionSigning);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('The signature on the payload in the verifiableCredential is invalid');
    expect(response.code).toEqual('VCSDKVaHe27');

    // no header
    validationResponse = await options.getTokenObjectDelegate(validationResponse, `.${splitToken[1]}.${splitToken[2]}`);
    response = await options.validateDidSignatureDelegate(validationResponse, validationResponse.didSignature as IPayloadProtectionSigning);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('Failed to validate signature');
    expect(response.code).toEqual('VCSDKVaHe28');

    // no payload
    validationResponse = await options.getTokenObjectDelegate(validationResponse, `${splitToken[0]}..${splitToken[2]}`);
    response = await options.validateDidSignatureDelegate(validationResponse, validationResponse.didSignature as IPayloadProtectionSigning);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('Failed to validate signature');
    expect(response.code).toEqual('VCSDKVaHe28');
  });

  it('should test checkTimeValidityOnTokenDelegate', () => {
    const options = new ValidationOptions(setup.validatorOptions, TokenType.verifiableCredential);

    // Set the payload
    const validationResponse: IValidationResponse = {
      status: 200,
      result: true
    };

    validationResponse.payloadObject = JSON.parse('{"jti": "abcdefg"}');

    let response = options.checkTimeValidityOnTokenDelegate(validationResponse);
    expect(response.result).toBeTruthy(response.detailedError);

    // Add exp
    let exp = new Date().getTime() / 1000;
    validationResponse.expiration = exp + 5;
    response = options.checkTimeValidityOnTokenDelegate(validationResponse, 10);
    expect(response.result).toBeTruthy(response.detailedError);

    validationResponse.expiration = exp - 1000;
    response = options.checkTimeValidityOnTokenDelegate(validationResponse, 5);
    expect(response.result).toBeFalsy(response.result);
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError?.startsWith('The presented verifiableCredential is expired')).toBeTruthy();
    expect(response.code).toEqual('VCSDKVaHe12');

    validationResponse.expiration = 0;
    response = options.checkTimeValidityOnTokenDelegate(validationResponse, 5);
    expect(response.result).toBeFalsy(response.result);
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError?.startsWith('The presented verifiableCredential is expired')).toBeTruthy();
    expect(response.code).toEqual('VCSDKVaHe12');

    // Add nbf
    validationResponse.expiration = undefined;
    let nbf = new Date().getTime() / 1000;
    validationResponse.payloadObject = JSON.parse(`{"jti": "abcdefg", "nbf": ${nbf}}`);
    response = options.checkTimeValidityOnTokenDelegate(validationResponse, 5);
    expect(response.result).toBeTruthy(response.detailedError);
    nbf = (new Date().getTime() / 1000) + 10;
    validationResponse.payloadObject = JSON.parse(`{"jti": "abcdefg", "nbf": ${nbf}}`);
    response = options.checkTimeValidityOnTokenDelegate(validationResponse, 5);
    expect(response.result).toBeFalsy(response.result);
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError?.startsWith('The presented verifiableCredential is not yet valid')).toBeTruthy();
    expect(response.code).toEqual('VCSDKVaHe40');
  });

  it('should test checkScopeValidityOnVcToken', () => {
    const options = new ValidationOptions(setup.validatorOptions, TokenType.verifiableCredential);

    // Set the payload
    const validationResponse: IValidationResponse = {
      status: 200,
      result: true
    };

    validationResponse.payloadObject = JSON.parse('{"sub": "did"}');

    let response = options.checkScopeValidityOnVcTokenDelegate(validationResponse, <any>{}, 'did');
    expect(response.result).toBeTruthy(response.detailedError);

    // Negative cases
    // wrong did
    response = options.checkScopeValidityOnVcTokenDelegate(validationResponse, <any>{}, 'wrong did');
    expect(response.detailedError).toEqual(`Wrong sub property in verifiableCredential. Expected 'wrong did'`);
    expect(response.code).toEqual('VCSDKVaHe22');

    // missing sub
    delete validationResponse.payloadObject.sub;
    response = options.checkScopeValidityOnVcTokenDelegate(validationResponse, <any>{}, 'did');
    expect(response.detailedError).toEqual(`Missing sub property in verifiableCredential. Expected 'did'`);
    expect(response.code).toEqual('VCSDKVaHe21');
  });

  it('should test checkScopeValidityOnIdTokenDelegate', () => {
    const options = new ValidationOptions(setup.validatorOptions, TokenType.verifiableCredential);

    const issuer = 'iss';
    const audience = 'aud'

    const validationResponse: IdTokenValidationResponse = {
      expectedIssuer: issuer,
      issuer,
      status: 200,
      result: true
    };

    // Set the payload
    validationResponse.payloadObject = {
      iss: issuer,
      aud: audience
    }

    const expected: IExpectedAudience = {
      audience
    };

    let response = options.checkScopeValidityOnIdTokenDelegate(validationResponse, expected);
    expect(response.result).toBeTruthy();
    expect(response.status).toEqual(200);

    // Negative cases
    validationResponse.expectedIssuer = undefined;
    response = options.checkScopeValidityOnIdTokenDelegate(validationResponse, expected);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`The issuer in configuration was not found`);
    expect(response.code).toEqual('VCSDKVaHe13');
    validationResponse.expectedIssuer = issuer;

    validationResponse.payloadObject.aud = undefined;
    response = options.checkScopeValidityOnIdTokenDelegate(validationResponse, expected);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`The audience undefined is invalid`);
    expect(response.code).toEqual('VCSDKVaHe16');
    validationResponse.payloadObject.aud = audience;

    validationResponse.payloadObject.aud = 'xxx';
    response = options.checkScopeValidityOnIdTokenDelegate(validationResponse, expected);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`The audience xxx is invalid`);
    expect(response.code).toEqual('VCSDKVaHe16');
    validationResponse.payloadObject.aud = audience;

    validationResponse.issuer = 'xxx';
    response = options.checkScopeValidityOnIdTokenDelegate(validationResponse, expected);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`The issuer in configuration 'iss' does not correspond with the issuer in the payload xxx`);
    expect(response.code).toEqual('VCSDKVaHe15');
    validationResponse.issuer = issuer;

    validationResponse.issuer = undefined;
    response = options.checkScopeValidityOnIdTokenDelegate(validationResponse, expected);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Missing iss property in idToken. Expected '"iss"'`);
    expect(response.code).toEqual('VCSDKVaHe14');
    validationResponse.issuer = issuer;
  });

  it('should test fetchKeyAndValidateSignatureOnIdTokenDelegate', async () => {
    const options = new ValidationOptions(setup.validatorOptions, TokenType.idToken);
    const validationResponse: IValidationResponse = {
      status: 200,
      result: true
    };

    let [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid);
    const payload = {
      jti: 'jti'
    };

    const idToken = await IssuanceHelpers.signAToken(setup, payload, tokenConfiguration, tokenJwkPrivate);

    let response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
    expect(response.result).toBeTruthy();
    expect(response.status).toEqual(200);

    const validateSignatureOnToken = options.validateSignatureOnTokenDelegate;

    // check all keys
    const idTokenWithoutKid = new ClaimToken(TokenType.idToken, `${base64url.encode('{"typ": "JWT"}')}.${base64url.encode('{"text": "jules"}')}.abcdef`, setup.defaultIdTokenConfiguration);
    options.validateSignatureOnTokenDelegate = () => {
      return new Promise((resolve) => {
        resolve({
          result: true,
          status: 200
        });
      });
    }

    response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idTokenWithoutKid);
    expect(response.result).toBeTruthy();
    expect(response.status).toEqual(200);

    // negative cases
    // configuration not found
    const tokenWithBadConfiguration = new ClaimToken(idToken.type, idToken.rawToken, 'abcd');
    response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, tokenWithBadConfiguration);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('Could not fetch token configuration');
    expect(response.code).toEqual('VCSDKVaHe34');

    // no keys in configuration

    setup.fetchMock.get(setup.defaultIdTokenConfiguration, { "issuer": `${setup.tokenIssuer}` }, { overwriteRoutes: true });
    response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('No reference to jwks found in token configuration');
    expect(response.code).toEqual('VCSDKVaHe30');

    // no issuer in configuration
    setup.fetchMock.get(setup.defaultIdTokenConfiguration, { "jwks_uri": `${setup.defaultIdTokenJwksConfiguration}` }, { overwriteRoutes: true });
    response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('No issuer found in token configuration');
    expect(response.code).toEqual('VCSDKVaHe33');

    // could not fetch keys
    [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid);
    setup.fetchMock.get(setup.defaultIdTokenJwksConfiguration, 404, { overwriteRoutes: true });
    response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Could not fetch keys needed to validate token on '${setup.defaultIdTokenJwksConfiguration}'`);
    expect(response.code).toEqual('VCSDKVaHe31');

    // bad keys
    [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid);
    setup.fetchMock.get(setup.defaultIdTokenJwksConfiguration, { "issuer": `${setup.tokenIssuer}` }, { overwriteRoutes: true });
    response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`No or bad jwks keys found in token configuration`);
    expect(response.code).toEqual('VCSDKVaHe32');
    [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid);

    setup.fetchMock.get(setup.defaultIdTokenJwksConfiguration, `test`, { overwriteRoutes: true });
    response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Could not fetch token configuration`);
    expect(response.code).toEqual('VCSDKVaHe34');

    // Failed signature
    [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid);
    options.validateSignatureOnTokenDelegate = () => {
      return new Promise((resolve) => {
        resolve({
          result: false,
          status: ValidatorBuilder.INVALID_TOKEN_STATUS_CODE
        });
      });
    }
    response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid);
    options.validateSignatureOnTokenDelegate = () => {
      return new Promise((_, reject) => {
        reject({
          result: false,
          status: ValidatorBuilder.INVALID_TOKEN_STATUS_CODE
        });
      });
    }
    
    response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual(`Could not validate signature on id token`);
    expect(response.code).toEqual('VCSDKVaHe36');

    // bad keys in configuration
    const badKey = {
      crv: 'secp256k1',
      x: 'AU-WZrK8O_rx4wlq3idyuFlvACM_sMXZputpkzyHPMk',
      y: 'qOpL6upm2RSrwrTBbUvL_4xYnSTdSFLtjOlQlJ74pt0',
      alg: 'ES256K',
      kty: 'EC',
      use: 'verify'
    };

    idToken.tokenHeader['kid'] = undefined;
    options.validateSignatureOnTokenDelegate = validateSignatureOnToken;
    setup.fetchMock.get(setup.defaultIdTokenJwksConfiguration, `{"keys": [${JSON.stringify(badKey)}]}`, { overwriteRoutes: true });

    response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
    expect(response.detailedError).toEqual('Could not validate token signature');
    expect(response.code).toEqual('VCSDKVaHe35');
  });

  it('should test fetchOpenIdTokenPublicKeysDelegate', async () => {
    const options = new ValidationOptions(setup.validatorOptions, TokenType.idToken);
    const validationResponse: IValidationResponse = {
      status: 200,
      result: true
    };

    let [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid);
    const payload = {
      jti: 'jti'
    };

    const idToken = await IssuanceHelpers.signAToken(setup, payload, tokenConfiguration, tokenJwkPrivate);

    let response = await options.fetchOpenIdTokenPublicKeysDelegate(validationResponse, idToken);
    expect(response).toBeDefined();
    expect(response.keys).toBeDefined();
    expect(Array.isArray(response.keys)).toBeTruthy();
    expect((<Array<any>>response.keys).length).toBeGreaterThan(0);

    // negative cases
    // Bad response
    setup.fetchMock.get(setup.defaultIdTokenJwksConfiguration, { "status": 400 }, { overwriteRoutes: true });
    response = <IValidationResponse>await options.fetchOpenIdTokenPublicKeysDelegate(validationResponse, idToken);
    expect(response.detailedError).toEqual(`Could not fetch keys needed to validate token on 'http://example/jwks'`);
    expect(response.code).toEqual('VCSDKVaHe31');

    setup.fetchMock.get(setup.defaultIdTokenConfiguration, { "body": {} }, { overwriteRoutes: true });
    response = <IValidationResponse>await options.fetchOpenIdTokenPublicKeysDelegate(validationResponse, idToken);
    expect(response.detailedError).toEqual(`No reference to jwks found in token configuration`);
    expect(response.code).toEqual('VCSDKVaHe30');
    /*
          setup.fetchMock.get(setup.defaultIdTokenConfiguration, {"body": {
            "jwks_uri": `setup.defaultIdTokenJwksConfiguration`
          }}, {overwriteRoutes: true});
          response = <IValidationResponse>await options.fetchOpenIdTokenPublicKeysDelegate(validationResponse, idToken);
          expect(response.detailedError).toEqual(`No reference to jwks found in token configuration`);
    */
    setup.fetchMock.get(setup.defaultIdTokenConfiguration, { "status": 400 }, { overwriteRoutes: true });
    response = <IValidationResponse>await options.fetchOpenIdTokenPublicKeysDelegate(validationResponse, idToken);
    expect(response.detailedError).toEqual(`Could not fetch token configuration needed to validate token`);
    expect(response.code).toEqual('VCSDKVaHe29');
    expect(response.status).toEqual(ValidatorBuilder.INVALID_TOKEN_STATUS_CODE);
  });
});