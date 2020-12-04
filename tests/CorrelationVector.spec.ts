/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 */

import { CorrelationVectorVersion } from "../lib/tracing/CorrelationVectorVersion";
import { SpinCounterInterval, SpinCounterPeriodicity, SpinEntropy, SpinParameters } from "../lib/tracing/SpinParameters";
import { CorrelationVector } from "../lib/tracing/CorrelationVector";

describe("Correlation Vector", () => {
    it("Should be able to Create v1 cV", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const correlationVector: CorrelationVector = CorrelationVector.createCorrelationVector();
        const splitVector: string[] = correlationVector.value.split(".");
        if (splitVector.length !== 2) {
            fail("Newly Seeded Server cV is expecting two segments");
        }
        if (parseInt(splitVector[1], 10) !== 0) {
            fail("Server Seeded cV should have a 0 in the first extention");
        }
        if (splitVector[0].length !== 16) {
            fail("Server Seeded v1 cV base should be 16 characters in length");
        }
        expect(1).toEqual(1);
    });

    it("Should be able to Create v2 cV", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const correlationVector: CorrelationVector =
            CorrelationVector.createCorrelationVector(CorrelationVectorVersion.V2);
        const splitVector: string[] = correlationVector.value.split(".");
        if (splitVector.length !== 2) {
            fail("Newly Seeded Server cV is expecting two segments");
        }

        if (parseInt(splitVector[1], 10) !== 0) {
            fail("Server Seeded cV should have a 0 in the first extention");
        }
        if (splitVector[0].length !== 22) {
            fail("Server Seeded v1 cV base should be 22 characters in length");
        }
        expect(1).toEqual(1);
    });

    it("Should be able to Parse v1 vector", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const correlationVector: CorrelationVector =
            CorrelationVector.parse("ifCuqpnwiUimg7Pk.1");
        const splitVector: string[] = correlationVector.value.split(".");

        if (splitVector[0] !== "ifCuqpnwiUimg7Pk") {
            fail("Correlation Vector base was not parsed properly");
        }
        if (splitVector[1] !== "1") {
            fail("Correlation Vector extension was not parsed properly");
        }
        expect(1).toEqual(1);
    });

    it("Should be able to Parse v2 vector", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const correlationVector: CorrelationVector =
            CorrelationVector.parse("Y58xO9ov0kmpPvkiuzMUVA.3.4.5");
        const splitVector: string[] = correlationVector.value.split(".");

        if (splitVector[0] !== "Y58xO9ov0kmpPvkiuzMUVA") {
            fail("Correlation Vector base was not parsed properly");
        }
        if (splitVector[1] !== "3") {
            fail("Correlation Vector extension was not parsed properly");
        }
        if (splitVector[2] !== "4") {
            fail("Correlation Vector extension was not parsed properly");
        }
        if (splitVector[3] !== "5") {
            fail("Correlation Vector extension was not parsed properly");
        }
        expect(1).toEqual(1);
    });

    it("Should be able to increment cV", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const correlationVector: CorrelationVector = CorrelationVector.createCorrelationVector();
        correlationVector.increment();

        const splitVector: string[] = correlationVector.value.split(".");

        if (parseInt(splitVector[1], 10) !== 1) {
            fail("Expected 1 on increment but got " + splitVector[1]);
        }
        expect(1).toEqual(1);
    });

    it("Should be able to extend cV", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        let correlationVector: CorrelationVector = CorrelationVector.createCorrelationVector();
        let splitVector: string[] = correlationVector.value.split(".");
        const vectorBase: string = splitVector[0];
        const extension: string = splitVector[1];

        correlationVector = CorrelationVector.extend(correlationVector.value);
        splitVector = correlationVector.value.split(".");

        if (splitVector.length !== 3) {
            fail("Correlation Vector should contain 3 components separated by a '.' after extension");
        }
        if (vectorBase !== splitVector[0]) {
            fail("Correlation Vector base should contain the same base after extension");
        }
        if (extension !== splitVector[1]) {
            fail("Correlation Vector should preserve original");
        }
        if ("0" !== splitVector[2]) {
            fail("Correlation Vector new extension should start with zero");
        }
        expect(1).toEqual(1);
    });

    it("Should be able to validate cV creation", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = true;
        const correlationVector: CorrelationVector = CorrelationVector.createCorrelationVector();
        correlationVector.increment();

        const splitVector: string[] = correlationVector.value.split(".");

        if (parseInt(splitVector[1], 10) !== 1) {
            fail("Expected 1 on increment but got " + splitVector[1]);
        }
        expect(1).toEqual(1);
    });

    it("should not extend from empty cV", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        // this shouldn't throw since we skip validation
        CorrelationVector.extend("");

        CorrelationVector.validateCorrelationVectorDuringCreation = true;
        expect(() => { CorrelationVector.extend(""); })
            .toThrowError(/.*correlation vector can not be null or bigger than.*/i);
    });

    it("should throw exception with insufficient chars", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        // this shouldn't throw since we skip validation
        CorrelationVector.extend("tul4NUsfs9Cl7mO.1");

        CorrelationVector.validateCorrelationVectorDuringCreation = true;
        expect(() => { CorrelationVector.extend("tul4NUsfs9Cl7mO.1"); })
            .toThrowError(/Invalid correlation vector .*. Invalid base value .*/i);
    });

    it("should throw exception with too many chars", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        // this shouldn't throw since we skip validation
        CorrelationVector.extend("tul4NUsfs9Cl7mOfN/dupsl.1");

        CorrelationVector.validateCorrelationVectorDuringCreation = true;
        expect(() => { CorrelationVector.extend("tul4NUsfs9Cl7mOfN/dupsl.1"); })
            .toThrowError(/Invalid correlation vector .*. Invalid base value .*/i);
    });

    it("should throw exception with too big value", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        // this shouldn't throw since we skip validation
        CorrelationVector.extend("tul4NUsfs9Cl7mOf.2147483647.2147483647.2147483647.2147483647.2147483647");

        CorrelationVector.validateCorrelationVectorDuringCreation = true;
        // bigger than 63 chars
        expect(() => { CorrelationVector.extend("tul4NUsfs9Cl7mOf.2147483647.2147483647.2147483647.2147483647.2147483647"); })
            .toThrowError(/.*correlation vector can not be null or bigger than.*/i);
    });

    it("should throw exception with too big value for v2 version", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        // this shouldn't throw since we skip validation
        CorrelationVector.extend(
            "KZY+dsX2jEaZesgCPjJ2Ng.2147483647.2147483647.2147483647.2147483647" +
            ".2147483647.2147483647.2147483647.2147483647.2147483647.2147483647");

        CorrelationVector.validateCorrelationVectorDuringCreation = true;
        // bigger than 63 chars
        expect(() => {
            CorrelationVector.extend(
                "KZY+dsX2jEaZesgCPjJ2Ng.2147483647.2147483647.2147483647.2147483647" +
                ".2147483647.2147483647.2147483647.2147483647.2147483647.2147483647");
        })
            .toThrowError(/.*correlation vector can not be null or bigger than.*/i);
    });

    it("should throw exception with negetive extension value", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        // this shouldn't throw since we skip validation
        CorrelationVector.extend("tul4NUsfs9Cl7mOf.-10");

        CorrelationVector.validateCorrelationVectorDuringCreation = true;
        // bigger than 63 chars
        expect(() => { CorrelationVector.extend("tul4NUsfs9Cl7mOf.-10"); })
            .toThrowError(/Invalid correlation vector .*. Invalid extension value .*/i);
    });

    it("should be immutable when increment past max", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const vector: CorrelationVector =
            CorrelationVector.extend("tul4NUsfs9Cl7mOf.2147483647.2147483647.2147483647.21474836479");
        vector.increment();
        if ("tul4NUsfs9Cl7mOf.2147483647.2147483647.2147483647.21474836479.1" !== vector.value) {
            fail("Expect 1 on increment");
        }
        for (let i: number = 0; i < 20; i++) {
            vector.increment();
        }
        expect(vector.value).toBe("tul4NUsfs9Cl7mOf.2147483647.2147483647.2147483647.21474836479.9!");
    });

    it("should be immutable when increment past max for v2 version", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const base: string = "KZY+dsX2jEaZesgCPjJ2Ng.2147483647.2147483647.2147483647" +
            ".2147483647.2147483647.2147483647.2147483647.2147483647.2147483647.214";
        const vector: CorrelationVector =
            CorrelationVector.extend(base);
        vector.increment();
        if (`${base}.1` !== vector.value) {
            fail("Expect 1 on increment");
        }
        for (let i: number = 0; i < 20; i++) {
            vector.increment();
        }
        expect(vector.value).toBe(`${base}.9!`);
    });

    it("Should be able to Spin should Aways be getting bigger", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const vector: CorrelationVector = CorrelationVector.createCorrelationVector();
        const spinParameters: SpinParameters = new SpinParameters
            (SpinCounterInterval.Fine, SpinCounterPeriodicity.Short, SpinEntropy.Two);

        let lastSpinValue: number = 0;
        let wrappedCounter: number = 0;
        for (let i: number = 0; i < 9; i++) {
            // the cV after a Spin will look like <cvBase>.0.<spinValue>.0, so the spinValue is at index = 2.
            let newVector: string = CorrelationVector.spin(vector.value, spinParameters).value;
            let spinValue: number = parseInt(
                newVector.split(".")[2],
                10);

            // count the number of times the counter wraps.
            if (spinValue <= lastSpinValue) {
                wrappedCounter++;
            }

            lastSpinValue = spinValue;

            // sleep 10 ms
            let old: number = Date.now();
            do {
                if (Date.now() > old + 10) {
                    break;
                }
            } while (true);

        }
        expect(wrappedCounter).toBeLessThan(1);
    });

    it("Should be immutable if spin past max size", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const baseVector: string = "tul4NUsfs9Cl7mOf.2147483647.2147483647.2147483647.214748364.23";

        // we hit 63 chars limit, will append "!" to vector
        const vector: CorrelationVector = CorrelationVector.spin(baseVector);
        expect(vector.value).toBe(`${baseVector}!`);
    });

    it("Should be immutable if spin past max size for v2", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const baseVector: string = "KZY+dsX2jEaZesgCPjJ2Ng.2147483647.2147483647.2147483647." +
            "2147483647.2147483647.2147483647.2147483647.2147483647.2147483647.214";

        // we hit 127 chars limit, will append "!" to vector
        const vector: CorrelationVector = CorrelationVector.spin(baseVector);
        expect(vector.value).toBe(`${baseVector}!`);
    });

    it("Should be immutable if extend past max size", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const baseVector: string = "tul4NUsfs9Cl7mOf.2147483647.2147483647.2147483647.214748364.23";

        // we hit 63 chars limit, will append "!" to vector
        const vector: CorrelationVector = CorrelationVector.extend(baseVector);
        expect(vector.value).toBe(`${baseVector}!`);
    });

    it("Should be immutable if extend past max size for v2", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const baseVector: string = "KZY+dsX2jEaZesgCPjJ2Ng.2147483647.2147483647.2147483647" +
            ".2147483647.2147483647.2147483647.2147483647.2147483647.2147483647.2141";

        // we hit 127 chars limit, will append "!" to vector
        const vector: CorrelationVector = CorrelationVector.extend(baseVector);
        expect(vector.value).toBe(`${baseVector}!`);
    });

    it("Should be immutable with termination sign", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const baseVector: string = "tul4NUsfs9Cl7mOf.2147483647.2147483647.2147483647.21474836479.0!";

        let vector: CorrelationVector = CorrelationVector.extend(baseVector);
        // extend should do nothing
        if (vector.value !== baseVector) {
            fail("extend immutable vector returns wrong value: " + vector.value);
        }

        vector = CorrelationVector.spin(baseVector);
        // spin should do nothing
        if (vector.value !== baseVector) {
            fail("spin immutable vector returns wrong value: " + vector.value);
        }

        vector.increment();
        // increment should do nothing since it has termination sign
        if (vector.value !== baseVector) {
            fail("increment immutable vector returns wrong value: " + vector.value);
        }

        expect(1).toBe(1);
    });

    it("Should be immutable with termination sign for v2", () => {
        CorrelationVector.validateCorrelationVectorDuringCreation = false;
        const baseVector: string = "KZY+dsX2jEaZesgCPjJ2Ng.2147483647.2147483647.2147483647.2147483647" +
            ".2147483647.2147483647.2147483647.2147483647.2147483647.214.0!";

        let vector: CorrelationVector = CorrelationVector.extend(baseVector);
        // extend should do nothing
        if (vector.value !== baseVector) {
            fail("extend immutable vector returns wrong value: " + vector.value);
        }

        vector = CorrelationVector.spin(baseVector);
        // spin should do nothing
        if (vector.value !== baseVector) {
            fail("spin immutable vector returns wrong value: " + vector.value);
        }

        vector.increment();
        // increment should do nothing since it has termination sign
        if (vector.value !== baseVector) {
            fail("increment immutable vector returns wrong value: " + vector.value);
        }

        expect(1).toBe(1);
    });
});