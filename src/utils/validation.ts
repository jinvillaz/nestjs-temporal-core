/**
 * @fileoverview Validation utilities for NestJS Temporal Core
 *
 * This module provides validation functions for cron expressions, interval
 * expressions, and other input formats used in scheduling decorators.
 *
 * @author NestJS Temporal Core
 * @version 1.0.0
 */

/**
 * Validates cron expression format.
 *
 * Supports both 5-field (minute hour day month weekday) and
 * 6-field (second minute hour day month weekday) cron formats.
 *
 * @param cron - The cron expression to validate
 * @returns True if the cron expression has valid basic format
 *
 * @example
 * ```typescript
 * console.log(isValidCronExpression('0 8 * * *')); // true (daily at 8 AM)
 * console.log(isValidCronExpression('0 0 8 * * *')); // true (6-field format)
 * console.log(isValidCronExpression('invalid')); // false
 * ```
 */
export function isValidCronExpression(cron: string): boolean {
    if (!cron || typeof cron !== 'string') {
        return false;
    }

    const parts = cron.trim().split(/\s+/);

    // Support both 5-field (minute hour day month weekday) and 6-field (second minute hour day month weekday) format
    if (parts.length !== 5 && parts.length !== 6) {
        return false;
    }

    // Basic validation - each part should not be empty
    return parts.every((part) => part.length > 0 && part !== '');
}

/**
 * Validates interval expression format.
 *
 * Accepts time duration format with number followed by unit:
 * - ms: milliseconds
 * - s: seconds
 * - m: minutes
 * - h: hours
 * - d: days
 *
 * @param interval - The interval expression to validate
 * @returns True if the interval expression has valid format
 *
 * @example
 * ```typescript
 * console.log(isValidIntervalExpression('5m')); // true (5 minutes)
 * console.log(isValidIntervalExpression('2h')); // true (2 hours)
 * console.log(isValidIntervalExpression('30s')); // true (30 seconds)
 * console.log(isValidIntervalExpression('invalid')); // false
 * ```
 */
export function isValidIntervalExpression(interval: string): boolean {
    if (!interval || typeof interval !== 'string') {
        return false;
    }

    // Match patterns like: 1s, 5m, 2h, 1d, 30s, etc.
    // Also support ms (milliseconds) for very short intervals
    const intervalPattern = /^\d+(ms|[smhd])$/;
    return intervalPattern.test(interval.trim());
}
