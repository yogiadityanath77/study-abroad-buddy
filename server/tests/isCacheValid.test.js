// tests/isCacheValid.test.js
// Unit tests for the isCacheValid logic from guideController.
//
// isCacheValid is a pure function with no dependencies — it only compares
// plain object fields. We define it here directly rather than importing
// guideController, which would pull in all 4 agents and openaiClient.
// The logic is copied exactly from guideController.js and must stay in sync.

const isCacheValid = (cache, user) => {
  if (!cache) return false;
  const g = cache.generatedFor;
  return (
    g.homeCountry === user.homeCountry &&
    g.destinationCountry === user.destinationCountry &&
    g.destinationCity === user.destinationCity &&
    String(g.travelStartDate) === String(user.travelStartDate) &&
    String(g.travelEndDate) === String(user.travelEndDate)
  );
};

const baseUser = {
  homeCountry: 'India',
  destinationCountry: 'United Kingdom',
  destinationCity: 'London',
  travelStartDate: new Date('2025-09-01'),
  travelEndDate: new Date('2026-06-30'),
};

const validCache = {
  generatedFor: {
    homeCountry: 'India',
    destinationCountry: 'United Kingdom',
    destinationCity: 'London',
    travelStartDate: new Date('2025-09-01'),
    travelEndDate: new Date('2026-06-30'),
  },
};

describe('isCacheValid', () => {

  test('returns true when all profile fields match the cache', () => {
    expect(isCacheValid(validCache, baseUser)).toBe(true);
  });

  test('returns false when cache is null', () => {
    expect(isCacheValid(null, baseUser)).toBe(false);
  });

  test('returns false when cache is undefined', () => {
    expect(isCacheValid(undefined, baseUser)).toBe(false);
  });

  test('returns false when homeCountry has changed', () => {
    const user = { ...baseUser, homeCountry: 'Germany' };
    expect(isCacheValid(validCache, user)).toBe(false);
  });

  test('returns false when destinationCountry has changed', () => {
    const user = { ...baseUser, destinationCountry: 'Canada' };
    expect(isCacheValid(validCache, user)).toBe(false);
  });

  test('returns false when destinationCity has changed', () => {
    const user = { ...baseUser, destinationCity: 'Manchester' };
    expect(isCacheValid(validCache, user)).toBe(false);
  });

  test('returns false when travelStartDate has changed', () => {
    const user = { ...baseUser, travelStartDate: new Date('2025-10-01') };
    expect(isCacheValid(validCache, user)).toBe(false);
  });

  test('returns false when travelEndDate has changed', () => {
    const user = { ...baseUser, travelEndDate: new Date('2026-08-31') };
    expect(isCacheValid(validCache, user)).toBe(false);
  });

});