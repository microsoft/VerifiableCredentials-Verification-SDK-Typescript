import { CorrelationId, DidDocument, IDidResolver, IDidResolveResult } from '../index';
require('es6-promise').polyfill();
require('isomorphic-fetch');

/**
 * Fetches DID Documents from remote resolvers over http and caching
 * the response for a specified period of time.
 * @class
 * @extends DidResolver
 */
export default class ManagedHttpResolver implements IDidResolver {
  /**
   * String to hold the formatted resolver url
   */
  public readonly resolverUrl: string;

  /**
   * @param universalResolverUrl the URL endpoint of the remote universal resolvers
   */
  constructor (universalResolverUrl: string) {
    // Format and set the property for the
    const slash = universalResolverUrl.endsWith('/') ? '' : '/';
    this.resolverUrl = `${universalResolverUrl}${slash}`;
  }

  /**
   * Looks up a DID Document
   * @inheritdoc
   */
  public async resolve (did: string, correlationId?: CorrelationId): Promise<IDidResolveResult> {
    const query = `${this.resolverUrl}${did}`;
    let response: Response;
    if (correlationId) {
      correlationId.increment();  
      response = await fetch(query, {
        method: 'GET',
        headers: {
          'MS-CV': correlationId.correlationId
        }
      });

    } else {
      response = await fetch(query);
    }
 
    if (response.status >= 200 && response.status < 300) {
      const didDocument = await response.json();
      return {
        didDocument: new DidDocument(didDocument.didDocument),
        metadata: didDocument.resolverMetadata
      } as IDidResolveResult;
    }
    return Promise.reject(new Error(`Could not resolve ${query}`));
  }
}
