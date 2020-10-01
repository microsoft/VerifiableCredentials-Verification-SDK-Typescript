import { ValidatorBuilder } from '../lib/index';
import TestSetup from './TestSetup';
import ValidationQueue from '../lib/input_validation/ValidationQueue';
import SiopValidationSimulation from './SiopValidationSimulation';

describe('SiopValidationSimulation', () => {
  let setup: TestSetup;
  beforeEach(async () => {
    setup = new TestSetup();
    setup.fetchMock.reset();
    await setup.generateKeys();
  });
  afterEach(async () => {
    setup.fetchMock.reset();
  });
});