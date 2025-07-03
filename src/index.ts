import 'reflect-metadata';

/**
 * @fileoverview NestJS Temporal Core - Complete Temporal.io Integration for NestJS
 *
 * This is the main entry point for the NestJS Temporal Core library, providing
 * a comprehensive integration between NestJS and Temporal.io workflow engine.
 *
 * Key Features:
 * - Auto-discovery of activities and scheduled workflows
 * - Declarative scheduling with @Cron and @Interval decorators
 * - Comprehensive client and worker management
 * - Production-ready health monitoring and error handling
 * - Rich TypeScript support with utilities and validation
 * - Modular architecture for flexible deployments
 *
 * @author NestJS Temporal Core
 * @version 1.0.0
 * @see {@link https://github.com/temporal-community/nestjs-temporal-core} for documentation
 */

// ==========================================
// Core Module and Service
// ==========================================

/** Main Temporal module for unified integration */
export { TemporalModule } from './temporal.module';

/** Unified service providing all Temporal functionality */
export { TemporalService } from './temporal.service';

// ==========================================
// Client Components
// ==========================================

/** Temporal client module for workflow operations */
export { TemporalClientModule } from './client/temporal-client.module';

/** Service for Temporal client operations (start workflows, signals, queries) */
export { TemporalClientService } from './client/temporal-client.service';

/** Service for schedule operations */
export { TemporalScheduleService } from './client/temporal-schedule.service';

// ==========================================
// Worker Components
// ==========================================

/** Worker module for activity execution */
export { TemporalWorkerModule } from './worker/temporal-worker.module';

/** Service for worker lifecycle management */
export { TemporalWorkerManagerService } from './worker/temporal-worker-manager.service';

/** Metadata accessor for worker configuration */
export { TemporalMetadataAccessor } from './worker/temporal-metadata.accessor';

// ==========================================
// Activity Components
// ==========================================

/** Activity module for activity discovery and management */
export { TemporalActivityModule } from './activity/temporal-activity.module';

/** Service for activity operations */
export { TemporalActivityService } from './activity/temporal-activity.service';

// ==========================================
// Schedule Components
// ==========================================

/** Schedules module for schedule management */
export { TemporalSchedulesModule } from './schedules/temporal-schedules.module';

/** Service for schedule operations */
export { TemporalSchedulesService } from './schedules/temporal-schedules.service';

// ==========================================
// Discovery Services
// ==========================================

/** Service for automatic discovery of activities and workflows */
export { TemporalDiscoveryService } from './discovery/temporal-discovery.service';

/** Service for schedule discovery and management */
export { TemporalScheduleManagerService } from './discovery/temporal-schedule-manager.service';

// ==========================================
// Utilities and Helpers
// ==========================================

/** All utility functions (validation, metadata, logging) */
export * from './utils';

// ==========================================
// Decorators
// ==========================================

/** All decorators for activities, workflows, and scheduling */
export * from './decorators';

// ==========================================
// Type Definitions and Interfaces
// ==========================================

/** All TypeScript interfaces and type definitions */
export * from './interfaces';

// ==========================================
// Constants and Predefined Values
// ==========================================

/** Essential constants and predefined values */
export {
    // Default configuration values
    DEFAULT_NAMESPACE,
    DEFAULT_TASK_QUEUE,
    DEFAULT_CONNECTION_TIMEOUT_MS,

    // Metadata keys for decorators
    TEMPORAL_ACTIVITY,
    TEMPORAL_ACTIVITY_METHOD,
    TEMPORAL_SIGNAL_METHOD,
    TEMPORAL_QUERY_METHOD,
    TEMPORAL_SCHEDULED_WORKFLOW,
    WORKFLOW_PARAMS_METADATA,

    // Dependency injection tokens
    TEMPORAL_CLIENT,
    TEMPORAL_MODULE_OPTIONS,
    TEMPORAL_CONNECTION,

    // Predefined expressions and values
    CRON_EXPRESSIONS,
    INTERVAL_EXPRESSIONS,
    TIMEOUTS,
    RETRY_POLICIES,
} from './constants';

// ==========================================
// Core Temporal Service
// ==========================================
export * from './temporal.service';

// ==========================================
// Core Temporal Module
// ==========================================
export * from './temporal.module';

// ==========================================
// Re-export Temporal SDK Types for Convenience
// ==========================================
export type { RetryPolicy, Duration, SearchAttributes } from '@temporalio/common';

export type { ScheduleOverlapPolicy, WorkflowHandle, Client } from '@temporalio/client';

export type { Worker } from '@temporalio/worker';
