/**
 * Shared constants used across the application.
 * Centralizing these prevents inconsistencies.
 */

// Authentication
export const AUTH_COOKIE_NAME = "whop_session";

// Credits
export const DAILY_CREDITS = 3;
export const CREDITS_KEY_PREFIX = "alphasolver:credits:";
export const CREDITS_EXPIRY_SECONDS = 172800; // 48 hours

// Allowed redirect paths for OAuth
export const ALLOWED_REDIRECT_PATHS = ['/app', '/experiences/', '/discover', '/dashboard'];

