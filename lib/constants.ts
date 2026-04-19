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

/** Redis credits key suffix when NEXT_PUBLIC_BYPASS_ACCESS is enabled (local/dev only). */
export const BYPASS_CREDITS_USER_SUB = "alphasolver_bypass_user";

// Allowed redirect paths for OAuth
export const ALLOWED_REDIRECT_PATHS = ['/app', '/experiences/', '/discover', '/dashboard'];

