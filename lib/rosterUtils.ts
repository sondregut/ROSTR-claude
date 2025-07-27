/**
 * Utility functions for roster navigation and person mapping
 */

// Map person names to roster IDs
const PERSON_NAME_TO_ROSTER_ID: Record<string, string> = {
  'Alex': '1',
  'Jordan': '2',
  'Taylor': '3',
  'Morgan': '4',
  'Riley': '5',
  'Casey': '6',
};

// Map roster IDs to person names
const ROSTER_ID_TO_PERSON_NAME: Record<string, string> = {
  '1': 'Alex',
  '2': 'Jordan',
  '3': 'Taylor',
  '4': 'Morgan',
  '5': 'Riley',
  '6': 'Casey',
};

/**
 * Get roster ID from person name
 */
export const getRosterIdFromPersonName = (personName: string): string | null => {
  return PERSON_NAME_TO_ROSTER_ID[personName] || null;
};

/**
 * Get person name from roster ID
 */
export const getPersonNameFromRosterId = (rosterId: string): string | null => {
  return ROSTER_ID_TO_PERSON_NAME[rosterId] || null;
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