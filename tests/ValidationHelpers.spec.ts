/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import TestSetup from './TestSetup';
import { IValidationResponse } from '../lib/InputValidation/IValidationResponse';
import base64url from 'base64url';
import { ICryptoToken } from '@microsoft/crypto-sdk';
import ValidationOptions from '../lib/Options/ValidationOptions';
import { IExpected } from '../lib/index';
import { IssuanceHelpers } from './IssuanceHelpers';
import ClaimToken, { TokenType } from '../lib/VerifiableCredential/ClaimToken';

 describe('ValidationHelpers', () => {
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
  });
  
  afterEach(() => {
    setup.fetchMock.reset();
  });

  it('should test getTokenObject', async () => {
    let [request, options, siopRequest] = await IssuanceHelpers.createRequest(setup, TokenType.verifiableCredential);
    const validationResponse: IValidationResponse = {
      status: 200,
      result: true
    }
    let response = options.getTokenObjectDelegate(validationResponse, request.rawToken);
    expect(response.result).toBeTruthy();
    expect(response.status).toEqual(200);    

    // negative cases
    // malformed token
    let splitToken = request.rawToken.split('.');
    response = options.getTokenObjectDelegate(validationResponse, splitToken[0]);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(400);    
    expect(response.detailedError).toEqual('The verifiableCredential could not be deserialized');

    // missing kid
    const header: any = JSON.parse(base64url.decode(splitToken[0]));
    header.kid = '';
    response = options.getTokenObjectDelegate(validationResponse, `${base64url.encode(JSON.stringify(header))}.${splitToken[1]}.${splitToken[2]}`);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);    
    expect(response.detailedError).toEqual('The protected header in the verifiableCredential does not contain the kid');

    // malformed kid
    // TODO 
    return;
    header.kid = 'xxxx';
    response = options.getTokenObjectDelegate(validationResponse, `${base64url.encode(JSON.stringify(header))}.${splitToken[1]}.${splitToken[2]}`);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);    
    expect(response.detailedError).toEqual('The kid in the verifiableCredential does not contain the did. Required format for kid is <did>#kid');
  });

  it('should test resolveDid', async () => {
    let [request, options, siopRequest] = await IssuanceHelpers.createRequest(setup, TokenType.verifiableCredential);
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
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual('The kid is not referenced in the request');
    validationResponse.didKid = setup.defaulUserDidKid;

    // No public key
    validationResponse.didKid = 'abcd';
    response = await options.resolveDidAndGetKeysDelegate(validationResponse);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`The did '${setup.defaultUserDid}' does not have a public key with kid '${validationResponse.didKid}'`);
    validationResponse.didKid = setup.defaulUserDidKid;

    // No did document
    setup.fetchMock.get(`${setup.resolverUrl}/${setup.defaultUserDid}`, {}, {overwriteRoutes: true});
    response = await options.resolveDidAndGetKeysDelegate(validationResponse);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
  });

  it('should not resolve resolveDid', async () => {
    let [request, options, siopRequest] = await IssuanceHelpers.createRequest(setup, TokenType.verifiableCredential);
    const validationResponse: IValidationResponse = {
      status: 200,
      result: true
    };
    validationResponse.did = 'did Jules';
    const response = await options.resolveDidAndGetKeysDelegate(validationResponse);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);    
    expect(response.detailedError).toEqual('Could not resolve DID \'did Jules\'');
  });

  it('should test validateDidSignatureDelegate', async () => {
    let [request, options, siopRequest] = await IssuanceHelpers.createRequest(setup, TokenType.verifiableCredential);
    let validationResponse: IValidationResponse = {
      status: 200,
      result: true,
      did: setup.defaultUserDid
    };
    validationResponse = options.getTokenObjectDelegate(validationResponse, request.rawToken);
    validationResponse.didSigningPublicKey = siopRequest.didJwkPublic;
    const token = validationResponse.didSignature as ICryptoToken;
    let response = await options.validateDidSignatureDelegate(validationResponse, token);
    expect(response.result).toBeTruthy();
    expect(response.status).toEqual(200); 
    
    // negative cases
    // Bad signature
    validationResponse = options.getTokenObjectDelegate(validationResponse, request.rawToken + 1);    
    response = await options.validateDidSignatureDelegate(validationResponse, validationResponse.didSignature as ICryptoToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403); 
    expect(response.detailedError).toEqual('The signature on the payload in the verifiableCredential is invalid');

    // No signature
    const splitToken = request.rawToken.split('.');
    validationResponse = options.getTokenObjectDelegate(validationResponse, `${splitToken[0]}.${splitToken[1]}`);    
    response = await options.validateDidSignatureDelegate(validationResponse, validationResponse.didSignature as ICryptoToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403); 
    expect(response.detailedError).toEqual('The signature on the payload in the verifiableCredential is invalid');

    // no header
    validationResponse = options.getTokenObjectDelegate(validationResponse, `.${splitToken[1]}.${splitToken[2]}`);    
    response = await options.validateDidSignatureDelegate(validationResponse, validationResponse.didSignature as ICryptoToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403); 
    expect(response.detailedError).toEqual('Failed to validate signature');

    // no payload
    validationResponse = options.getTokenObjectDelegate(validationResponse, `${splitToken[0]}..${splitToken[2]}`);    
    response = await options.validateDidSignatureDelegate(validationResponse, validationResponse.didSignature as ICryptoToken);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403); 
    expect(response.detailedError).toEqual('Failed to validate signature');
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
    expect(response.result).toBeTruthy();

    // Add exp
    let exp = new Date().getTime() / 1000;
    validationResponse.payloadObject = JSON.parse(`{"jti": "abcdefg", "exp": ${exp}}`);
    response = options.checkTimeValidityOnTokenDelegate(validationResponse, 5);
    expect(response.result).toBeTruthy();
    exp = (new Date().getTime() / 1000) - 10;
    validationResponse.payloadObject = JSON.parse(`{"jti": "abcdefg", "exp": ${exp}}`);
    response = options.checkTimeValidityOnTokenDelegate(validationResponse, 5);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError?.startsWith('The presented verifiableCredential is expired')).toBeTruthy();

    // Add nbf
    let nbf = new Date().getTime() / 1000;
    validationResponse.payloadObject = JSON.parse(`{"jti": "abcdefg", "nbf": ${nbf}}`);
    response = options.checkTimeValidityOnTokenDelegate(validationResponse, 5);
    expect(response.result).toBeTruthy();
    nbf = (new Date().getTime() / 1000) + 10;
    validationResponse.payloadObject = JSON.parse(`{"jti": "abcdefg", "nbf": ${nbf}}`);
    response = options.checkTimeValidityOnTokenDelegate(validationResponse, 5);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError?.startsWith('The presented verifiableCredential is not yet valid')).toBeTruthy();

    // Add iat
    let iat = new Date().getTime() / 1000;
    validationResponse.payloadObject = JSON.parse(`{"jti": "abcdefg", "iat": ${iat}}`);
    response = options.checkTimeValidityOnTokenDelegate(validationResponse, 5);
    expect(response.result).toBeTruthy();
    iat = (new Date().getTime() / 1000) + 10;
    validationResponse.payloadObject = JSON.parse(`{"jti": "abcdefg", "iat": ${iat}}`);
    response = options.checkTimeValidityOnTokenDelegate(validationResponse, 5);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError?.startsWith('The presented verifiableCredential is not valid')).toBeTruthy();
  });
  it('should test checkScopeValidityOnTokenDelegate', () => {
    const options = new ValidationOptions(setup.validatorOptions, TokenType.verifiableCredential);

    const validationResponse: IValidationResponse = {
      status: 200,
      result: true
    };

    const issuer = 'iss';
    const audience = 'aud'

    // Set the payload
    validationResponse.payloadObject = {
      iss: issuer,
      aud: audience
    }

    let response = options.checkScopeValidityOnTokenDelegate(validationResponse, {type: TokenType.idToken, issuers: [issuer], audience: audience} as IExpected);
    expect(response.result).toBeTruthy();
    expect(response.status).toEqual(200);

    // Negative cases
    validationResponse.payloadObject.iss = undefined;
    response = options.checkScopeValidityOnTokenDelegate(validationResponse, {type: TokenType.idToken, issuers: [issuer], audience: audience} as IExpected);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong or missing iss property in verifiableCredential. Expected '["iss"]'`);
    validationResponse.payloadObject.iss = issuer;

    validationResponse.payloadObject.aud = 'xxx';
    response = options.checkScopeValidityOnTokenDelegate(validationResponse, {type: TokenType.idToken, issuers: [issuer], audience: audience} as IExpected);
    expect(response.result).toBeFalsy();
    expect(response.status).toEqual(403);
    expect(response.detailedError).toEqual(`Wrong or missing aud property in verifiableCredential. Expected 'aud'`);
    validationResponse.payloadObject.aud = audience;
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

      const idToken = await IssuanceHelpers.signAToken(setup, JSON.stringify(payload), tokenConfiguration, tokenJwkPrivate);

      let response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
      expect(response.result).toBeTruthy();
      expect(response.status).toEqual(200);

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
      expect(response.status).toEqual(403);
      expect(response.detailedError).toEqual('Could not fetch token configuration');

      // no keys in configuration
  
      setup.fetchMock.get(setup.defaultIdTokenConfiguration, {"issuer": `${setup.tokenIssuer}`}, {overwriteRoutes: true});
      response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
      expect(response.result).toBeFalsy();
      expect(response.status).toEqual(403);
      expect(response.detailedError).toEqual('No reference to jwks found in token configuration');

      // no issuer in configuration
      setup.fetchMock.get(setup.defaultIdTokenConfiguration, {"jwks_uri": `${setup.defaultIdTokenJwksConfiguration}`}, {overwriteRoutes: true});
      response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
      expect(response.result).toBeFalsy();
      expect(response.status).toEqual(403);
      expect(response.detailedError).toEqual('No issuer found in token configuration');

      // could not fetch keys
      [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid); 
      setup.fetchMock.get(setup.defaultIdTokenJwksConfiguration, 404, {overwriteRoutes: true});
      response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
      expect(response.result).toBeFalsy();
      expect(response.status).toEqual(403);
      expect(response.detailedError).toEqual(`Could not fetch keys needed to validate token on '${setup.defaultIdTokenJwksConfiguration}'`);

      // bad keys
      [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid); 
      setup.fetchMock.get(setup.defaultIdTokenJwksConfiguration, {"issuer": `${setup.tokenIssuer}`}, {overwriteRoutes: true});
      response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
      expect(response.result).toBeFalsy();
      expect(response.status).toEqual(403);
      expect(response.detailedError).toEqual(`No or bad jwks keys found in token configuration`);
      [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid); 

      setup.fetchMock.get(setup.defaultIdTokenJwksConfiguration, `test`, {overwriteRoutes: true});
      response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
      expect(response.result).toBeFalsy();
      expect(response.status).toEqual(403);
      expect(response.detailedError).toEqual(`Could not fetch token configuration`);

      // Failed signature
      [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid); 
      options.validateSignatureOnTokenDelegate = () => {
        return new Promise((resolve) => {
          resolve({
            result: false,
            status: 403
          });
        });
      }
      response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
      expect(response.result).toBeFalsy();
      expect(response.status).toEqual(403);
      [tokenJwkPrivate, tokenJwkPublic, tokenConfiguration] = await IssuanceHelpers.generateSigningKeyAndSetConfigurationMock(setup, setup.defaulIssuerDidKid); 
      options.validateSignatureOnTokenDelegate = () => {
        return new Promise((_, reject) => {
          reject({
            result: false,
            status: 403
          });
        });
      }
      response = await options.fetchKeyAndValidateSignatureOnIdTokenDelegate(validationResponse, idToken);
      expect(response.result).toBeFalsy();
      expect(response.status).toEqual(403);
      expect(response.detailedError).toEqual(`Could not validate signature`);
  });
});