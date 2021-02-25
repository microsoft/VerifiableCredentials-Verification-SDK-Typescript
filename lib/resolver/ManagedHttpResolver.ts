import ErrorHelpers from '../error_handling/ErrorHelpers';
import { DidDocument, IDidResolver, IDidResolveResult, ValidationError } from '../index';
import FetchRequest from '../tracing/FetchRequest';
import IFetchRequest from '../tracing/IFetchRequest';
const errorCode = (error: number) => ErrorHelpers.errorCode('VCSDKMARE', error);

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
   * Create an instance of ManagedHttpResolver
   * @param universalResolverUrl the URL endpoint of the remote universal resolvers
   * @param fetchRequest optional fetch client
   */
  constructor(universalResolverUrl: string, public fetchRequest?: IFetchRequest) {
    // Format and set the property for the
    const slash = universalResolverUrl.endsWith('/') ? '' : '/';
    this.resolverUrl = `${universalResolverUrl}${slash}`;
  }

  /**
   * Looks up a DID Document
   * @inheritdoc
   */
  public async resolve(did: string): Promise<IDidResolveResult> {
    const query = `${this.resolverUrl}${did}`;
    let response: Response;
    if (!this.fetchRequest) {
      this.fetchRequest = new FetchRequest();
    }

    response = await this.fetchRequest.fetch(query, 'DIDResolve', {
      method: 'GET',
      headers: {
      }
    });

    if (response.status >= 200 && response.status < 300) {
      const didDocument = await response.json();
      return {
        didDocument: new DidDocument(didDocument.didDocument),
        metadata: didDocument.resolverMetadata
      } as IDidResolveResult;
    }
    
    return Promise.reject(new ValidationError(`Could not resolve ${query}`, errorCode(1)));
  }
}
