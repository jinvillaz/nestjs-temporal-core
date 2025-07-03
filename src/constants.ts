/**
 * @fileoverview Constants for NestJS Temporal Core integration
 *
 * This file contains all the constants used throughout the NestJS Temporal Core library,
 * including metadata keys, injection tokens, default values, and predefined configurations.
 *
 * @author NestJS Temporal Core
 * @version 1.0.0
 */

// ==========================================
// Module & Injection Tokens
// ==========================================

/** Token for injecting Temporal module configuration options */
export const TEMPORAL_MODULE_OPTIONS = 'TEMPORAL_MODULE_OPTIONS';

/** Token for injecting the Temporal client instance */
export const TEMPORAL_CLIENT = 'TEMPORAL_CLIENT';

/** Token for injecting the Temporal connection instance */
export const TEMPORAL_CONNECTION = 'TEMPORAL_CONNECTION';

// Module-specific tokens
/** Token for Activity module configuration options */
export const ACTIVITY_MODULE_OPTIONS = 'ACTIVITY_MODULE_OPTIONS';

/** Token for Schedules module configuration options */
export const SCHEDULES_MODULE_OPTIONS = 'SCHEDULES_MODULE_OPTIONS';

/** Token for Worker module configuration options */
export const WORKER_MODULE_OPTIONS = 'WORKER_MODULE_OPTIONS';

// ==========================================
// Metadata Keys
// ==========================================

/** Metadata key for marking classes as Temporal activities */
export const TEMPORAL_ACTIVITY = 'TEMPORAL_ACTIVITY';

/** Metadata key for marking methods as Temporal activity methods */
export const TEMPORAL_ACTIVITY_METHOD = 'TEMPORAL_ACTIVITY_METHOD';

/** Metadata key for marking methods as Temporal signal handlers */
export const TEMPORAL_SIGNAL_METHOD = 'TEMPORAL_SIGNAL_METHOD';

/** Metadata key for marking methods as Temporal query handlers */
export const TEMPORAL_QUERY_METHOD = 'TEMPORAL_QUERY_METHOD';

/** Metadata key for marking workflows as scheduled */
export const TEMPORAL_SCHEDULED_WORKFLOW = 'TEMPORAL_SCHEDULED_WORKFLOW';

// Parameter decorator metadata keys
/** Metadata key for workflow parameter injection */
export const WORKFLOW_PARAMS_METADATA = 'workflow:params';

/** Metadata key for workflow context injection */
export const WORKFLOW_CONTEXT_METADATA = 'workflow:context';

/** Metadata key for workflow ID injection */
export const WORKFLOW_ID_METADATA = 'workflow:id';

/** Metadata key for run ID injection */
export const RUN_ID_METADATA = 'workflow:runId';

/** Metadata key for task queue injection */
export const TASK_QUEUE_METADATA = 'workflow:taskQueue';

// ==========================================
// Default Values
// ==========================================

/** Default Temporal namespace */
export const DEFAULT_NAMESPACE = 'default';

/** Default task queue name */
export const DEFAULT_TASK_QUEUE = 'default-task-queue';

/** Default connection timeout in milliseconds */
export const DEFAULT_CONNECTION_TIMEOUT_MS = 5000;

// ==========================================
// Predefined Cron Expressions
// ==========================================

/**
 * Collection of commonly used cron expressions for scheduling workflows.
 * These expressions follow the standard 5-field cron format: minute hour day month weekday
 */
export const CRON_EXPRESSIONS = {
    // Minutes
    /** Run every minute */
    EVERY_MINUTE: '* * * * *',
    /** Run every 5 minutes */
    EVERY_5_MINUTES: '*/5 * * * *',
    /** Run every 15 minutes */
    EVERY_15_MINUTES: '*/15 * * * *',
    /** Run every 30 minutes */
    EVERY_30_MINUTES: '*/30 * * * *',

    // Hours
    /** Run every hour at minute 0 */
    EVERY_HOUR: '0 * * * *',
    /** Run every 2 hours */
    EVERY_2_HOURS: '0 */2 * * *',
    /** Run every 6 hours */
    EVERY_6_HOURS: '0 */6 * * *',
    /** Run every 12 hours */
    EVERY_12_HOURS: '0 */12 * * *',

    // Daily
    /** Run daily at midnight */
    DAILY_MIDNIGHT: '0 0 * * *',
    /** Run daily at 6 AM */
    DAILY_6AM: '0 6 * * *',
    /** Run daily at 8 AM */
    DAILY_8AM: '0 8 * * *',
    /** Run daily at noon */
    DAILY_NOON: '0 12 * * *',
    /** Run daily at 6 PM */
    DAILY_6PM: '0 18 * * *',

    // Weekly
    /** Run every Sunday at midnight */
    WEEKLY_SUNDAY_MIDNIGHT: '0 0 * * 0',
    /** Run every Monday at 9 AM */
    WEEKLY_MONDAY_9AM: '0 9 * * 1',
    /** Run every Friday at 5 PM */
    WEEKLY_FRIDAY_5PM: '0 17 * * 5',

    // Monthly & Yearly
    /** Run on the first day of every month */
    MONTHLY_FIRST: '0 0 1 * *',
    /** Run on the last day of every month */
    MONTHLY_LAST: '0 0 28-31 * *',
    /** Run yearly on January 1st */
    YEARLY: '0 0 1 1 *',
} as const;

// ==========================================
// Predefined Interval Expressions
// ==========================================

/**
 * Collection of commonly used interval expressions for scheduling workflows.
 * These expressions use time duration format: number followed by unit (s, m, h, d)
 */
export const INTERVAL_EXPRESSIONS = {
    // Seconds
    /** Run every 10 seconds */
    EVERY_10_SECONDS: '10s',
    /** Run every 30 seconds */
    EVERY_30_SECONDS: '30s',

    // Minutes
    /** Run every minute */
    EVERY_MINUTE: '1m',
    /** Run every 5 minutes */
    EVERY_5_MINUTES: '5m',
    /** Run every 15 minutes */
    EVERY_15_MINUTES: '15m',
    /** Run every 30 minutes */
    EVERY_30_MINUTES: '30m',

    // Hours
    /** Run every hour */
    EVERY_HOUR: '1h',
    /** Run every 2 hours */
    EVERY_2_HOURS: '2h',
    /** Run every 6 hours */
    EVERY_6_HOURS: '6h',
    /** Run every 12 hours */
    EVERY_12_HOURS: '12h',

    // Days
    /** Run daily (every 24 hours) */
    DAILY: '24h',
    /** Run every 2 days */
    EVERY_2_DAYS: '48h',
    /** Run weekly (every 168 hours) */
    WEEKLY: '168h',
} as const;

// ==========================================
// Predefined Timeout Values
// ==========================================

/**
 * Collection of commonly used timeout values for various Temporal operations.
 * These values provide sensible defaults for different types of operations.
 */
export const TIMEOUTS = {
    // Short operations
    /** Heartbeat timeout for activity heartbeats */
    HEARTBEAT: '30s',
    /** Timeout for signal operations */
    SIGNAL_TIMEOUT: '10s',
    /** Timeout for query operations */
    QUERY_TIMEOUT: '5s',

    // Medium operations
    /** Timeout for short-running activities */
    ACTIVITY_SHORT: '1m',
    /** Timeout for medium-running activities */
    ACTIVITY_MEDIUM: '5m',
    /** Timeout for long-running activities */
    ACTIVITY_LONG: '30m',

    // Long operations
    /** Timeout for short-running workflows */
    WORKFLOW_SHORT: '1h',
    /** Timeout for medium-running workflows */
    WORKFLOW_MEDIUM: '24h',
    /** Timeout for long-running workflows */
    WORKFLOW_LONG: '7d',

    // Connection timeouts
    /** Connection establishment timeout */
    CONNECTION_TIMEOUT: '10s',
    /** Service startup timeout */
    STARTUP_TIMEOUT: '30s',
} as const;

// ==========================================
// Retry Policy Presets
// ==========================================
export const RETRY_POLICIES = {
    // Quick retry for transient failures
    QUICK: {
        maximumAttempts: 3,
        initialInterval: '1s',
        maximumInterval: '10s',
        backoffCoefficient: 2.0,
    },

    // Standard retry policy
    STANDARD: {
        maximumAttempts: 5,
        initialInterval: '5s',
        maximumInterval: '60s',
        backoffCoefficient: 2.0,
    },

    // Aggressive retry for critical operations
    AGGRESSIVE: {
        maximumAttempts: 10,
        initialInterval: '1s',
        maximumInterval: '300s',
        backoffCoefficient: 1.5,
    },

    // Conservative retry for expensive operations
    CONSERVATIVE: {
        maximumAttempts: 3,
        initialInterval: '30s',
        maximumInterval: '600s',
        backoffCoefficient: 3.0,
    },
} as const;

// ==========================================
// Worker Configuration Presets
// ==========================================
export const WORKER_PRESETS = {
    // Development environment
    DEVELOPMENT: {
        maxConcurrentActivityTaskExecutions: 10,
        maxConcurrentWorkflowTaskExecutions: 5,
        maxConcurrentLocalActivityExecutions: 10,
        reuseV8Context: false, // Better for debugging
    },

    // Production environment - balanced
    PRODUCTION_BALANCED: {
        maxConcurrentActivityTaskExecutions: 100,
        maxConcurrentWorkflowTaskExecutions: 40,
        maxConcurrentLocalActivityExecutions: 100,
        reuseV8Context: true,
    },

    // Production environment - high throughput
    PRODUCTION_HIGH_THROUGHPUT: {
        maxConcurrentActivityTaskExecutions: 200,
        maxConcurrentWorkflowTaskExecutions: 80,
        maxConcurrentLocalActivityExecutions: 200,
        reuseV8Context: true,
        maxActivitiesPerSecond: 1000,
    },

    // Production environment - resource constrained
    PRODUCTION_MINIMAL: {
        maxConcurrentActivityTaskExecutions: 20,
        maxConcurrentWorkflowTaskExecutions: 10,
        maxConcurrentLocalActivityExecutions: 20,
        reuseV8Context: true,
    },
} as const;

// ==========================================
// Error Messages
// ==========================================
export const ERRORS = {
    // Client Errors
    CLIENT_INITIALIZATION: 'Failed to initialize Temporal client',
    CLIENT_NOT_INITIALIZED: 'Temporal client not initialized',

    // Worker Errors
    WORKER_INITIALIZATION: 'Failed to initialize Temporal worker',
    WORKER_NOT_INITIALIZED: 'Temporal worker not initialized',

    // Configuration Errors
    INVALID_OPTIONS: 'Invalid Temporal module options',
    MISSING_TASK_QUEUE: 'Task queue is required',
    MISSING_WORKFLOW_TYPE: 'Workflow type is required',
    MISSING_SCHEDULE_ID: 'Schedule ID is required',

    // Discovery Errors
    ACTIVITY_NOT_FOUND: 'Activity not found',
    WORKFLOW_NOT_FOUND: 'Workflow not found',
    DUPLICATE_WORKFLOW_NAME: 'Duplicate workflow name found',

    // Schedule Errors
    SCHEDULE_CLIENT_NOT_INITIALIZED: 'Temporal schedule client not initialized',
    INVALID_SCHEDULE_OPTIONS: 'Invalid schedule options',
    INVALID_CRON_EXPRESSION: 'Invalid cron expression',
    SCHEDULE_ALREADY_EXISTS: 'Schedule already exists',
    SCHEDULE_NOT_FOUND: 'Schedule not found',

    // Workflow Execution Errors
    WORKFLOW_EXECUTION_FAILED: 'Workflow execution failed',
    SIGNAL_DELIVERY_FAILED: 'Signal delivery failed',
    QUERY_EXECUTION_FAILED: 'Query execution failed',

    // Activity Execution Errors
    ACTIVITY_EXECUTION_FAILED: 'Activity execution failed',
    ACTIVITY_TIMEOUT: 'Activity execution timeout',
    ACTIVITY_RETRY_EXHAUSTED: 'Activity retry attempts exhausted',
} as const;

// ==========================================
// Workflow Policies
// ==========================================
export enum WorkflowIdReusePolicy {
    ALLOW_DUPLICATE = 0,
    ALLOW_DUPLICATE_FAILED_ONLY = 1,
    REJECT_DUPLICATE = 2,
    TERMINATE_IF_RUNNING = 3,
}

export enum WorkflowIdConflictPolicy {
    REJECT_DUPLICATE = 'REJECT_DUPLICATE',
    TERMINATE_IF_RUNNING = 'TERMINATE_IF_RUNNING',
    ALLOW_DUPLICATE = 'ALLOW_DUPLICATE',
}

export enum ScheduleOverlapPolicy {
    ALLOW_ALL = 'ALLOW_ALL',
    SKIP = 'SKIP',
    BUFFER_ONE = 'BUFFER_ONE',
    BUFFER_ALL = 'BUFFER_ALL',
    CANCEL_OTHER = 'CANCEL_OTHER',
}

// ==========================================
// Logging Categories
// ==========================================
export const LOG_CATEGORIES = {
    CLIENT: 'TemporalClient',
    WORKER: 'TemporalWorker',
    DISCOVERY: 'WorkflowDiscovery',
    SCHEDULE: 'ScheduleManager',
    ACTIVITY: 'ActivityExecution',
    WORKFLOW: 'WorkflowExecution',
} as const;
