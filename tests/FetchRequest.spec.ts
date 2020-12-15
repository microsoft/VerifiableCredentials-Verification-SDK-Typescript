import { CorrelationId } from "../lib";
import FetchRequest from "../lib/tracing/FetchRequest";

describe('FetchRequest', () => {
  it('should do fetch', async () => {
    const fetchMock = require('fetch-mock');
    fetchMock.get('https://example', {prop1: 'prop1'});

    const correlationId = 'A.1';
    let fetchRequest = new FetchRequest(correlationId);
    let response = await fetchRequest.fetch('https://example', 'testing', {method: 'GET'});
    expect(response.ok).toBeTruthy();
    expect(fetchRequest.correlationId).toEqual('A.2');

    let body = await response.json();
    expect(body['prop1']).toEqual('prop1');

    // check specific CV passed in
    response = await fetchRequest.fetch('https://example', 'testing', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'MS-CV': 'B.3',
      }
    });
    expect(response.ok).toBeTruthy();
    expect(fetchRequest.correlationId).toEqual('A.2');

    fetchMock.reset();
  });
  
});