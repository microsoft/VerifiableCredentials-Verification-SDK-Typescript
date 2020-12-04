/**
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 */

export enum SpinCounterInterval {
  /**
   * The coarse interval drops the 24 least significant bits in DateTime.Ticks
   * resulting in a counter that increments every 1.67 seconds.
   */
  Coarse,

  /**
   * The fine interval drops the 16 least significant bits in DateTime.Ticks
   * resulting in a counter that increments every 6.5 milliseconds.
   */
  Fine
}

export enum SpinCounterPeriodicity {
  /**
   * Do not store a counter as part of the spin value.
   */
  None = 0,

  /**
   * The short periodicity stores the counter using 16 bits.
   */
  Short = 16,

  /**
   * The medium periodicity stores the counter using 24 bits.
   */
  Medium = 24,
}

export enum SpinEntropy {
  /**
   * Do not generate entropy as part of the spin value.
   */
  None = 0,

  /**
   * Generate entropy using 8 bits.
   */
  One = 1,

  /**
   * Generate entropy using 16 bits.
   */
  Two = 2,
}

/**
* This class stores parameters used by the CorrelationVector Spin operator.
*/
export class SpinParameters {
  constructor(interval: SpinCounterInterval, periodicity: SpinCounterPeriodicity, entropy: SpinEntropy) {
      this.interval = interval;
      this.periodicity = periodicity;
      this.entropy = entropy;
  }

  /**
   * The interval (proportional to time) by which the counter increments.
   */
  public interval: SpinCounterInterval;

  /**
   * How frequently the counter wraps around to zero, as determined by the amount
   * of space to store the counter.
   */
  public periodicity: SpinCounterPeriodicity;

  /**
   * The number of bytes to use for entropy. Valid values from a
   * minimum of 0 to a maximum of 4.
   */
  public entropy: SpinEntropy;

  public get ticksBitsToDrop(): number {
      switch (this.interval) {
          case SpinCounterInterval.Coarse:
              return 24;

          case SpinCounterInterval.Fine:
              return 16;

          default:
              return 24;
      }
  }

  public get totalBits(): number {
      let counterBits: number = 0;
      switch (this.periodicity) {
          case SpinCounterPeriodicity.None:
              counterBits = 0;
              break;
          case SpinCounterPeriodicity.Short:
              counterBits = 16;
              break;
          case SpinCounterPeriodicity.Medium:
              counterBits = 24;
              break;
          default:
              counterBits = 0;
              break;
      }
      return counterBits + this.entropy * 8;
  }
}