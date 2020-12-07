import { CorrelationId, ManagedHttpResolver } from '../lib/index';
import { DidDocument } from '@decentralized-identity/did-common-typescript';

const fetchMock = require('fetch-mock');

  describe('ManagedHttpResolver', () => {
    beforeAll(() => {
      fetchMock.reset();
    })
    afterAll(() => {
      fetchMock.reset();
    })

    it('should resolve', async () => {

      let called = false;

      fetchMock.get('https://resolver/did', (_url: string, opts: any) => {
       if (opts) {
        expect(opts.method).toEqual('GET');
        expect(opts.headers['MS-CV'].split('.')[1]).toEqual('1');
        called = true;
       }
        const didDocument = {
          didDocument: new DidDocument({
            "@context": "https://w3id.org/did/v1",
            id: 'did',
            publicKey: <any>[{
              id: 'did',
              type: 'RsaVerificationKey2018',
              controller: 'did',
              publicKeyJwk: {}
            }]
          })
        };
        (didDocument.didDocument as any)['@context'] = 'https://w3id.org/did/v1';
        return didDocument;
      });

      const correlationId = new CorrelationId();
      const resolver = new ManagedHttpResolver('https://resolver');
      await resolver.resolve('did');
      await resolver.resolve('did', correlationId);
      expect(correlationId.correlationId.split('.')[1]).toEqual('1');
      expect(called).toBeTruthy();

      // Negative cases
      fetchMock.get('https://resolver/did', (_url: string, _opts: any) => {
        return { status: 404 };
       }, { overwriteRoutes: true });
       try {
        await resolver.resolve('did', correlationId);
        fail('exception on resolve was  not thrown');
       } catch (exception) {
         expect(exception).toEqual(new Error('Could not resolve https://resolver/did'));
       }
    });
  });