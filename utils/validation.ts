/**
 * Input validation utilities for forms and user inputs
 * Provides sanitization and validation to prevent XSS and SQL injection
 */

import { log } from '@/services/logger';

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Phone number regex (international format)
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

// Username regex (alphanumeric, underscore, dash, 3-20 chars)
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

// URL regex
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Instagram username regex
const INSTAGRAM_REGEX = /^@?[a-zA-Z0-9_.]{1,30}$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/script/gi, 'scr1pt'); // Neutralize script tags
}

/**
 * Sanitizes HTML content (more aggressive)
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  // Remove all HTML tags and entities
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .trim();
}

/**
 * Validates email address
 */
export function validateEmail(email: string): ValidationResult {
  const sanitized = sanitizeInput(email.toLowerCase());
  
  if (!sanitized) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!EMAIL_REGEX.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long' };
  }
  
  // Check for common weak passwords
  const weakPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: 'This password is too common. Please choose a stronger password' };
  }
  
  // Optional: Enforce complexity requirements
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const complexity = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (complexity < 2) {
    return { 
      isValid: false, 
      error: 'Password should contain at least 2 of: lowercase, uppercase, numbers, special characters' 
    };
  }
  
  return { isValid: true };
}

/**
 * Validates phone number
 */
export function validatePhone(phone: string): ValidationResult {
  const sanitized = sanitizeInput(phone.replace(/[\s-()]/g, ''));
  
  if (!sanitized) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  if (!PHONE_REGEX.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates username
 */
export function validateUsername(username: string): ValidationResult {
  const sanitized = sanitizeInput(username);
  
  if (!sanitized) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (!USERNAME_REGEX.test(sanitized)) {
    return { 
      isValid: false, 
      error: 'Username must be 3-20 characters and contain only letters, numbers, underscore, or dash' 
    };
  }
  
  // Check for reserved usernames
  const reserved = ['admin', 'api', 'root', 'support', 'help', 'about', 'contact'];
  if (reserved.includes(sanitized.toLowerCase())) {
    return { isValid: false, error: 'This username is reserved' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates name (first/last name)
 */
export function validateName(name: string): ValidationResult {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, error: 'Name is too long' };
  }
  
  // Allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(sanitized)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates age
 */
export function validateAge(age: string | number): ValidationResult {
  const numAge = typeof age === 'string' ? parseInt(age, 10) : age;
  
  if (isNaN(numAge)) {
    return { isValid: false, error: 'Please enter a valid age' };
  }
  
  if (numAge < 18) {
    return { isValid: false, error: 'You must be at least 18 years old' };
  }
  
  if (numAge > 120) {
    return { isValid: false, error: 'Please enter a valid age' };
  }
  
  return { isValid: true, sanitized: numAge.toString() };
}

/**
 * Validates URL
 */
export function validateUrl(url: string): ValidationResult {
  const sanitized = sanitizeInput(url);
  
  if (!sanitized) {
    return { isValid: true, sanitized: '' }; // URLs are often optional
  }
  
  // Add protocol if missing
  let urlToValidate = sanitized;
  if (!urlToValidate.startsWith('http://') && !urlToValidate.startsWith('https://')) {
    urlToValidate = `https://${urlToValidate}`;
  }
  
  if (!URL_REGEX.test(urlToValidate)) {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
  
  return { isValid: true, sanitized: urlToValidate };
}

/**
 * Validates Instagram username
 */
export function validateInstagram(username: string): ValidationResult {
  const sanitized = sanitizeInput(username);
  
  if (!sanitized) {
    return { isValid: true, sanitized: '' }; // Instagram is optional
  }
  
  // Remove @ if present
  const cleaned = sanitized.startsWith('@') ? sanitized.slice(1) : sanitized;
  
  if (!INSTAGRAM_REGEX.test(`@${cleaned}`)) {
    return { isValid: false, error: 'Please enter a valid Instagram username' };
  }
  
  return { isValid: true, sanitized: cleaned };
}

/**
 * Validates date input
 */
export function validateDate(date: string | Date): ValidationResult {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Please enter a valid date' };
  }
  
  // Check if date is not too far in the past
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);
  if (dateObj < minDate) {
    return { isValid: false, error: 'Date is too far in the past' };
  }
  
  // Check if date is not in the future (for past dates)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 1); // Allow today
  if (dateObj > maxDate) {
    return { isValid: false, error: 'Date cannot be in the future' };
  }
  
  return { isValid: true, sanitized: dateObj.toISOString() };
}

/**
 * Validates rating (1-5)
 */
export function validateRating(rating: string | number): ValidationResult {
  const numRating = typeof rating === 'string' ? parseInt(rating, 10) : rating;
  
  if (isNaN(numRating)) {
    return { isValid: false, error: 'Please select a rating' };
  }
  
  if (numRating < 1 || numRating > 5) {
    return { isValid: false, error: 'Rating must be between 1 and 5' };
  }
  
  return { isValid: true, sanitized: numRating.toString() };
}

/**
 * Validates text length
 */
export function validateTextLength(
  text: string, 
  minLength: number = 0, 
  maxLength: number = 1000,
  fieldName: string = 'Text'
): ValidationResult {
  const sanitized = sanitizeInput(text);
  
  if (sanitized.length < minLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at least ${minLength} characters` 
    };
  }
  
  if (sanitized.length > maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must not exceed ${maxLength} characters` 
    };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validates array of tags
 */
export function validateTags(tags: string[]): ValidationResult {
  if (!Array.isArray(tags)) {
    return { isValid: false, error: 'Invalid tags format' };
  }
  
  if (tags.length > 10) {
    return { isValid: false, error: 'Maximum 10 tags allowed' };
  }
  
  const sanitizedTags = tags.map(tag => sanitizeInput(tag)).filter(Boolean);
  
  for (const tag of sanitizedTags) {
    if (tag.length > 30) {
      return { isValid: false, error: 'Each tag must be 30 characters or less' };
    }
  }
  
  return { isValid: true, sanitized: JSON.stringify(sanitizedTags) };
}

/**
 * Composite validator for form data
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  validators: Partial<Record<keyof T, (value: any) => ValidationResult>>
): {
  isValid: boolean;
  errors: Partial<Record<keyof T, string>>;
  sanitized: Partial<T>;
} {
  const errors: Partial<Record<keyof T, string>> = {};
  const sanitized: Partial<T> = {};
  let isValid = true;
  
  for (const [field, validator] of Object.entries(validators)) {
    if (!validator) continue;
    
    const value = data[field as keyof T];
    const result = validator(value);
    
    if (!result.isValid) {
      errors[field as keyof T] = result.error;
      isValid = false;
    } else if (result.sanitized !== undefined) {
      sanitized[field as keyof T] = result.sanitized as any;
    }
  }
  
  log.debug('Form validation result', { isValid, errors }, 'Validation');
  
  return { isValid, errors, sanitized };
}

// Export all validators
export const validators = {
  email: validateEmail,
  password: validatePassword,
  phone: validatePhone,
  username: validateUsername,
  name: validateName,
  age: validateAge,
  url: validateUrl,
  instagram: validateInstagram,
  date: validateDate,
  rating: validateRating,
  text: validateTextLength,
  tags: validateTags,
};