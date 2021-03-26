import { RulesValidationError, VerifiablePresentationAttestationModel } from '../lib';

describe('VerifiablePresentationAttestationModel', () => {
  let vpAttestationModelInput: any;

  beforeAll(() => {
    vpAttestationModelInput = {
      mapping: { claimMapping1: { type: 'String', claim: '$.claim1' } },
      credentialType: 'VcType',
      validityInterval: 1343413,
    };
  });

  describe('populateFrom()', () => {
    it('should fail with undefined trusted issuer DID', () => {
      const undefinedDidIssuers = [{ iss: 'did:ion:issuer1' }, {}];
      const vpAttestationModel = new VerifiablePresentationAttestationModel();

      try {
        vpAttestationModel.populateFrom({ ...vpAttestationModelInput, issuers: undefinedDidIssuers });
        fail('No error was thrown.');
      } catch (error) {
        expect(error instanceof RulesValidationError).toEqual(true);
      }
    });

    it('should fail with invalid trusted issuer DID', () => {
      const trivialDidIssuers = [{ iss: 'did:ion:issuer1' }, { iss: '' }];
      const vpAttestationModel = new VerifiablePresentationAttestationModel();

      try {
        vpAttestationModel.populateFrom({ ...vpAttestationModelInput, issuers: trivialDidIssuers });
        fail('No error was thrown.');
      } catch (error) {
        expect(error instanceof RulesValidationError).toEqual(true);
      }
    });
  });
});