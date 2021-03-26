import { IdTokenAttestationModel, RulesValidationError } from '../lib';

describe('IdTokenAttestationModel', () => {
  let idTokenAttestationModelInput: any;

  beforeAll(() => {
    idTokenAttestationModelInput = {
      configuration: 'https://example.com/some-oidc-endpoint',
      client_id: 'client_id',
      redirect_uri: 'redirect_uri',
      mapping: { claimMapping1: { type: 'String', claim: 'claim1' } },
    };
  });

  describe('populateFrom()', () => {
    it('should fail with undefined trusted issuer DID', () => {
      const undefinedDidIssuers = [{ iss: 'did:ion:issuer1' }, {}];
      const idTokenAttestationModel = new IdTokenAttestationModel();

      try {
        idTokenAttestationModel.populateFrom({ ...idTokenAttestationModelInput, issuers: undefinedDidIssuers });
        fail('No error was thrown.');
      } catch (error) {
        expect(error instanceof RulesValidationError).toEqual(true);
      }
    });

    it('should fail with invalid trusted issuer DID', () => {
      const trivialDidIssuers = [{ iss: 'did:ion:issuer1' }, { iss: '' }];
      const idTokenAttestationModel = new IdTokenAttestationModel();

      try {
        idTokenAttestationModel.populateFrom({ ...idTokenAttestationModelInput, issuers: trivialDidIssuers });
        fail('No error was thrown.');
      } catch (error) {
        expect(error instanceof RulesValidationError).toEqual(true);
      }
    });

    it('should fail with non-string trusted issuer DID', () => {
      const nonStringDidIssuers = [{ iss: 1 }];
      const idTokenAttestationModel = new IdTokenAttestationModel();

      try {
        idTokenAttestationModel.populateFrom({ ...idTokenAttestationModelInput, issuers: nonStringDidIssuers });
        fail('No error was thrown.');
      } catch (error) {
        expect(error instanceof RulesValidationError).toEqual(true);
      }
    });
  });
});