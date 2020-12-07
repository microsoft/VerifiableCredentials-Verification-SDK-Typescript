/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 */
import CorrelationId from '../lib/tracing/CorrelationId';
import ICorrelationId from '../lib/tracing/ICorrelationId';


describe("CorrelationId", () => {
  it("should create a correlation id", () => {
    let correlationId: ICorrelationId = new CorrelationId();
    expect(correlationId.correlationId.split('.').length).toEqual(2);

    correlationId = new CorrelationId('AABBCCDDEEFF.0');
    expect(correlationId.correlationId).toEqual('AABBCCDDEEFF.0');
  });
  
  it("should extend a correlation id", () => {
    let correlationId: ICorrelationId = new CorrelationId();
    const originalCorrelationId = correlationId.correlationId;   
    const id = correlationId.extend();
    expect(id).toEqual(`${originalCorrelationId}.0`);
  });
  
  it("should increment a correlation id", () => {
    let correlationId: ICorrelationId = new CorrelationId();   
    const id = correlationId.increment();
    expect(id).toEqual(`${correlationId.correlationId.split('.')[0]}.1`);
  });
});