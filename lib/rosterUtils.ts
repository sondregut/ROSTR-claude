/**
 * Utility functions for roster navigation and person mapping
 */

// Map person names to roster IDs
const PERSON_NAME_TO_ROSTER_ID: Record<string, string> = {
  'Alex': '1',
  'Jordan': '2', 
  'Morgan': '4',
};

/**
 * Get roster ID from person name
 */
export const getRosterIdFromPersonName = (personName: string): string | null => {
  return PERSON_NAME_TO_ROSTER_ID[personName] || null;
};

/**
 * Check if a person has a roster profile
 */
export const hasRosterProfile = (personName: string): boolean => {
  return personName in PERSON_NAME_TO_ROSTER_ID;
};

/**
 * Get all available roster person names
 */
export const getAvailableRosterPersons = (): string[] => {
  return Object.keys(PERSON_NAME_TO_ROSTER_ID);
};