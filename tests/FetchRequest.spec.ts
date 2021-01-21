import FetchRequest from "../lib/tracing/FetchRequest";
const fetchMock = require('fetch-mock');
const delay = require('delay');

describe('FetchRequest', () => {
  beforeEach(() => { fetchMock.reset() });

  it('should do fetch', async () => {
    fetchMock.get('https://example', { prop1: 'prop1' });

    let fetchRequest = new FetchRequest();
    let response = await fetchRequest.fetch('https://example', 'testing', { method: 'GET' });
    expect(response.ok).toBeTruthy();

    let body = await response.json();
    expect(body['prop1']).toEqual('prop1');

    // check specific CV passed in
    response = await fetchRequest.fetch('https://example', 'testing', {
      method: 'GET',
    });
    expect(response.ok).toBeTruthy();
  });

  it('should timeout the fetch', async () => {
    fetchMock.get('https://example', async () => {
      await delay(500);
      return { prop1: 'prop1' }
    });

    let fetchRequest = new FetchRequest();
    try {
      await fetchRequest.fetch('https://example', 'testing', {
        method: 'GET',
        timeout: 10
      });
      fail('Timeout did not occur');
    } catch (exception) {
      expect(exception.message).toEqual('The operation was aborted.');
    }
  });
});