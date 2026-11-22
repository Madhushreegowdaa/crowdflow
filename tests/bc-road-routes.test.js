import { describe, expect, it } from 'vitest';
import { searchBuses } from '../src/services/busService.js';

describe('BC Road demo routes', () => {
  it.each([
    'Mangaluru Central Bus Stand',
    'Mangaluru City Railway Station',
    'Mangaluru Airport (Bajpe)',
    'Ullal Bus Stand',
    'Udupi Bus Stand'
  ])('finds a bus from BC Road Bus Stand to %s', (destination) => {
    const buses = searchBuses({
      source: 'BC Road Bus Stand',
      destination
    });

    expect(buses.length).toBeGreaterThan(0);
    expect(buses.every((bus) => bus.journeyDetails.isDirect)).toBe(true);
  });
});
