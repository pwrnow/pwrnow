import {
  formatDateRangeShort,
  formatTimeRangeShort,
  getInitials,
  formatPostTime,
} from '../format';

// Mock i18n
jest.mock('../i18n', () => ({
  deviceLocaleTag: 'en-US',
  t: (key: string) => {
    const translations: { [key: string]: string } = {
      justNow: 'Just now',
    };
    return translations[key] || key;
  },
}));

describe('format utility functions', () => {
  beforeAll(() => {
    // Mock the current date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('formatDateRangeShort', () => {
    it('formats same day events correctly', () => {
      const result = formatDateRangeShort(
        '2024-06-15T10:00:00Z',
        '2024-06-15T18:00:00Z'
      );
      expect(result).toContain('15');
      expect(result).toContain('Jun');
    });

    it('formats same month events correctly', () => {
      const result = formatDateRangeShort(
        '2024-06-10T10:00:00Z',
        '2024-06-20T18:00:00Z'
      );
      expect(result).toContain('10');
      expect(result).toContain('20');
      expect(result).toContain('Jun');
    });

    it('formats different month events correctly', () => {
      const result = formatDateRangeShort(
        '2024-06-15T10:00:00Z',
        '2024-07-20T18:00:00Z'
      );
      expect(result).toContain('15');
      expect(result).toContain('20');
    });

    it('includes year when event is not in current year', () => {
      const result = formatDateRangeShort(
        '2025-06-15T10:00:00Z',
        '2025-06-20T18:00:00Z'
      );
      expect(result).toContain('2025');
    });
  });

  describe('formatTimeRangeShort', () => {
    it('formats time range correctly', () => {
      const result = formatTimeRangeShort(
        '2024-06-15T10:00:00Z',
        '2024-06-15T18:00:00Z'
      );
      // Should contain the time separator
      expect(result).toContain('–');
      // Should have valid time format
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getInitials', () => {
    it('returns first initial from a single word', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('returns initials from two words', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('returns first two initials from three words', () => {
      expect(getInitials('John Michael Doe')).toBe('JM');
    });

    it('handles empty string', () => {
      expect(getInitials('')).toBe('');
    });

    it('returns uppercase initials', () => {
      expect(getInitials('jane smith')).toBe('JS');
    });
  });

  describe('formatPostTime', () => {
    it('returns "Just now" for posts less than 1 hour old', () => {
      const thirtyMinutesAgo = new Date('2024-06-15T11:30:00Z').toISOString();
      expect(formatPostTime(thirtyMinutesAgo)).toBe('Just now');
    });

    it('returns hours for posts less than 24 hours old', () => {
      const fiveHoursAgo = new Date('2024-06-15T07:00:00Z').toISOString();
      const result = formatPostTime(fiveHoursAgo);
      expect(result).toContain('h');
      expect(result).toContain('5');
    });

    it('returns days for posts more than 24 hours old', () => {
      const twoDaysAgo = new Date('2024-06-13T12:00:00Z').toISOString();
      const result = formatPostTime(twoDaysAgo);
      expect(result).toContain('d');
      expect(result).toContain('2');
    });
  });
});
