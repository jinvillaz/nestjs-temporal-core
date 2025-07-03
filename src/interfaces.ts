/**
 * @fileoverview Type definitions and interfaces for NestJS Temporal Core
 *
 * This file contains all TypeScript interfaces, types, and configurations
 * used throughout the NestJS Temporal Core library. It includes configuration
 * options, decorator interfaces, and re-exports from the Temporal SDK.
 *
 * @author NestJS Temporal Core
 * @version 1.0.0
 */

import { ModuleMetadata, Type } from '@nestjs/common';

// ==========================================
// Re-export Temporal SDK Types
// ==========================================

/** Re-exported from @temporalio/common for convenience */
export { RetryPolicy, Duration, SearchAttributes } from '@temporalio/common';

/** Re-exported from @temporalio/client for convenience */
export { ScheduleOverlapPolicy, WorkflowHandle, Client } from '@temporalio/client';

/** Re-exported from @temporalio/worker for convenience */
export { Worker } from '@temporalio/worker';

// ==========================================
// Core Connection & Configuration Interfaces
// ==========================================

/**
 * Configuration options for connecting to a Temporal server.
 * Supports both local development and Temporal Cloud configurations.
 */
export interface ConnectionOptions {
    /** Temporal server address (e.g., "localhost:7233" for local, or cloud endpoint) */
    address: string;
    /**
     * TLS configuration for secure connections.
     * Can be a boolean for basic TLS or detailed configuration object.
     */
    tls?:
        | boolean
        | {
              /** Server name for TLS verification */
              serverName?: string;
              /** Client certificate pair for mutual TLS */
              clientCertPair?: {
                  /** Certificate file content */
                  crt: Buffer;
                  /** Private key file content */
                  key: Buffer;
                  /** Certificate Authority file content */
                  ca?: Buffer;
              };
          };
    /** API key for Temporal Cloud authentication */
    apiKey?: string;
    /** Additional HTTP headers sent with requests */
    metadata?: Record<string, string>;
}

export interface TemporalOptions extends LoggerConfig {
    connection: {
        address: string;
        namespace?: string;
        tls?: ConnectionOptions['tls'];
        apiKey?: string;
        metadata?: Record<string, string>;
    };
    taskQueue?: string;
    worker?: {
        workflowsPath?: string;
        workflowBundle?: unknown;
        activityClasses?: Array<Type<unknown>>;
        autoStart?: boolean;
        workerOptions?: WorkerCreateOptions;
    };
    isGlobal?: boolean;
    allowConnectionFailure?: boolean;
}

export interface WorkerCreateOptions {
    maxConcurrentActivityTaskExecutions?: number;
    maxConcurrentWorkflowTaskExecutions?: number;
    maxConcurrentLocalActivityExecutions?: number;
    maxActivitiesPerSecond?: number;
    reuseV8Context?: boolean;
    identity?: string;
    buildId?: string;
    // Additional worker options for flexibility
    maxCachedWorkflows?: number;
    maxConcurrentWorkflowTaskPolls?: number;
    maxConcurrentActivityTaskPolls?: number;
    enableLoggingInReplay?: boolean;
}

export interface RetryPolicyConfig {
    maximumAttempts: number;
    initialInterval: string;
    maximumInterval: string;
    backoffCoefficient: number;
}

// ==========================================
// Async Configuration
// ==========================================

export interface TemporalOptionsFactory {
    createTemporalOptions(): Promise<TemporalOptions> | TemporalOptions;
}

export interface TemporalAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<TemporalOptionsFactory>;
    useClass?: Type<TemporalOptionsFactory>;
    useFactory?: (...args: unknown[]) => Promise<TemporalOptions> | TemporalOptions;
    inject?: (string | symbol | Type<unknown>)[];
    isGlobal?: boolean;
}

// ==========================================
// Module-Specific Configuration Interfaces
// ==========================================

/**
 * Client connection options used internally by the client module.
 * Simplified version of ConnectionOptions for internal usage.
 */
export interface ClientConnectionOptions {
    /** Temporal server address */
    address: string;
    /** TLS configuration */
    tls?: unknown;
    /** HTTP metadata headers */
    metadata?: Record<string, string>;
    /** API key for authentication */
    apiKey?: string;
    /** Temporal namespace */
    namespace?: string;
}

/**
 * Worker module configuration options.
 * Defines all options available for configuring a Temporal worker.
 */
export interface WorkerModuleOptions {
    /** Connection configuration */
    connection?: {
        address?: string;
        namespace?: string;
        tls?: boolean | object;
        apiKey?: string;
        metadata?: Record<string, string>;
    };
    /** Task queue name for the worker */
    taskQueue?: string;
    /** Path to workflow files */
    workflowsPath?: string;
    /** Pre-bundled workflow definitions */
    workflowBundle?: unknown;
    /** Array of activity classes to register */
    activityClasses?: Array<unknown>;
    /** Auto-start the worker on module initialization */
    autoStart?: boolean;
    /** Auto-restart the worker on failure */
    autoRestart?: boolean;
    /** Allow worker initialization failure without crashing */
    allowWorkerFailure?: boolean;
    /** Additional worker creation options */
    workerOptions?: WorkerCreateOptions;
    /** Enable logging for the worker */
    enableLogger?: boolean;
    /** Log level for worker operations */
    logLevel?: LogLevel;
}

/**
 * Global logger configuration interface.
 * Extends the base LoggerConfig with additional global settings.
 */
export interface GlobalLoggerConfig extends LoggerConfig {
    /** Application name prefix for all logs */
    appName?: string;
    /** Custom log formatter function */
    formatter?: (level: string, message: string, context: string, timestamp: string) => string;
    /** Enable logging to file */
    logToFile?: boolean;
    /** File path for log output */
    logFilePath?: string;
}

// ==========================================
// Signal and Query Related
// ==========================================

export interface SignalOptions {
    name?: string;
}

export interface QueryOptions {
    name?: string;
}

export interface StartWorkflowOptions {
    taskQueue: string;
    workflowId?: string;
    signal?: {
        name: string;
        args?: unknown[];
    };
    [key: string]: unknown;
}

export interface WorkflowExecutionContext {
    workflowId: string;
    runId: string;
    workflowType: string;
    taskQueue: string;
    namespace: string;
}

// ==========================================
// Activity Related
// ==========================================

export interface ActivityOptions {
    name?: string;
}

export interface ActivityMethodOptions {
    name?: string;
    timeout?: string | number; // TODO: Implement timeout handling in worker
    maxRetries?: number; // TODO: Implement retry logic in activity execution
}

export interface ActivityMetadata {
    name?: string;
    options?: Record<string, unknown>;
}

// ==========================================
// Scheduling
// ==========================================

export interface ScheduledOptions {
    scheduleId: string;
    cron?: string;
    interval?: string;
    description?: string;
    taskQueue?: string;
    timezone?: string;
    overlapPolicy?: 'ALLOW_ALL' | 'SKIP' | 'BUFFER_ONE' | 'BUFFER_ALL' | 'CANCEL_OTHER';
    startPaused?: boolean;
    autoStart?: boolean;
}

export interface CronOptions extends Omit<ScheduledOptions, 'cron' | 'interval'> {
    scheduleId: string;
}

export interface IntervalOptions extends Omit<ScheduledOptions, 'cron' | 'interval'> {
    scheduleId: string;
}

// ==========================================
// Discovery & Method Handlers
// ==========================================

export type SignalMethodHandler = (...args: unknown[]) => void | Promise<void>;
export type QueryMethodHandler = (...args: unknown[]) => unknown;
export type ActivityMethodHandler = (...args: unknown[]) => unknown | Promise<unknown>;

export interface SignalMethodInfo {
    methodName: string;
    signalName: string;
    options: SignalOptions;
    handler: SignalMethodHandler;
}

export interface QueryMethodInfo {
    methodName: string;
    queryName: string;
    options: QueryOptions;
    handler: QueryMethodHandler;
}

export interface ScheduledMethodInfo {
    methodName: string;
    workflowName: string;
    scheduleOptions: ScheduledOptions;
    workflowOptions: StartWorkflowOptions;
    handler: (...args: unknown[]) => unknown | Promise<unknown>;
    controllerInfo: {
        name: string;
        instance: object;
    };
}

export interface ActivityMethodMetadata {
    name: string;
    originalName: string;
    options?: Record<string, unknown>;
    handler: ActivityMethodHandler;
}

// ==========================================
// Statistics & Status
// ==========================================

export interface DiscoveryStats {
    controllers: number;
    methods: number;
    scheduled: number;
    signals: number;
    queries: number;
}

export interface ScheduleStatus {
    scheduleId: string;
    workflowName: string;
    isManaged: boolean;
    isActive: boolean;
    lastError?: string;
    createdAt: Date;
    lastUpdatedAt: Date;
}

export interface ScheduleStats {
    total: number;
    active: number;
    inactive: number;
    errors: number;
}

export interface WorkerStatus {
    isInitialized: boolean;
    isRunning: boolean;
    isHealthy: boolean;
    taskQueue: string;
    namespace: string;
    workflowSource: 'bundle' | 'filesystem' | 'none';
    activitiesCount: number;
    lastError?: string;
    startedAt?: Date;
    uptime?: number;
}

export interface SystemStatus {
    client: {
        available: boolean;
        healthy: boolean;
    };
    worker: {
        available: boolean;
        status?: WorkerStatus;
        health?: string;
    };
    discovery: DiscoveryStats;
    schedules: ScheduleStats;
}

export interface WorkflowParameterMetadata {
    type: 'param' | 'context' | 'workflowId' | 'runId' | 'taskQueue';
    index?: number;
    extractAll?: boolean;
}

// ==========================================
// Logger Configuration
// ==========================================

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export interface LoggerConfig {
    /** Enable/disable logging for the module */
    enableLogger?: boolean;
    /** Log level (error, warn, info, debug, verbose) */
    logLevel?: LogLevel;
}

// ==========================================
// Activity Module Interfaces
// ==========================================

export interface ActivityModuleOptions extends LoggerConfig {
    /** Specific activity classes to register (optional - will auto-discover if not provided) */
    activityClasses?: Array<Type<unknown>>;
    /** Timeout for activities */
    timeout?: string | number;
    /** Global module registration */
    global?: boolean;
}

export interface ActivityInfo {
    className: string;
    instance: object;
    targetClass: Type<unknown>;
    methods: Array<{
        name: string;
        methodName: string;
        options: ActivityMethodOptions;
    }>;
    totalMethods: number;
}

// ==========================================
// Schedules Module Interfaces
// ==========================================

export interface SchedulesModuleOptions extends LoggerConfig {
    /** Auto-start schedules on module initialization */
    autoStart?: boolean;
    /** Default timezone for schedules */
    defaultTimezone?: string;
    /** Global module registration */
    global?: boolean;
}

export interface ScheduleInfo {
    scheduleId: string;
    workflowName: string;
    cronExpression?: string;
    intervalExpression?: string;
    description?: string;
    timezone: string;
    overlapPolicy: 'ALLOW_ALL' | 'SKIP' | 'BUFFER_ONE' | 'BUFFER_ALL' | 'CANCEL_OTHER';
    isActive: boolean;
    autoStart: boolean;
    taskQueue?: string;
    handler: (...args: unknown[]) => unknown | Promise<unknown>;
    controllerInfo: {
        name: string;
        instance: object;
    };
    createdAt: Date;
    lastTriggered?: Date;
    lastModified?: Date;
    nextRun?: Date;
    triggerCount?: number;
    lastError?: string;
}
