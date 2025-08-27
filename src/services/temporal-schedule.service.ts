import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { ScheduleClient, ScheduleHandle } from '@temporalio/client';
import { TEMPORAL_MODULE_OPTIONS, TEMPORAL_CLIENT } from '../constants';
import { TemporalOptions } from '../interfaces';
import { TemporalMetadataAccessor } from './temporal-metadata.service';
import { TemporalLogger } from '../utils/logger';

/**
 * Service for managing Temporal schedules including creating, updating, and monitoring scheduled workflows
 */
@Injectable()
export class TemporalScheduleService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TemporalScheduleService.name);
    private readonly temporalLogger = new TemporalLogger(TemporalScheduleService.name);
    private scheduleClient?: ScheduleClient;
    private scheduleHandles = new Map<string, ScheduleHandle>();
    private isInitialized = false;

    constructor(
        @Inject(TEMPORAL_MODULE_OPTIONS)
        private readonly options: TemporalOptions,
        @Inject(TEMPORAL_CLIENT)
        private readonly client: any,
        private readonly discoveryService: DiscoveryService,
        private readonly metadataAccessor: TemporalMetadataAccessor,
    ) {}

    /**
     * Initialize the schedule service
     */
    async onModuleInit(): Promise<void> {
        try {
            this.logger.log('Initializing Temporal Schedule Service...');
            await this.initializeScheduleClient();
            await this.discoverAndRegisterSchedules();
            this.isInitialized = true;
            this.logger.log('Temporal Schedule Service initialized successfully');
        } catch (error) {
            this.logger.error(
                `Failed to initialize Temporal Schedule Service: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw error;
        }
    }

    /**
     * Cleanup on module destroy
     */
    async onModuleDestroy(): Promise<void> {
        try {
            this.logger.log('Shutting down Temporal Schedule Service...');
            this.scheduleHandles.clear();
            this.isInitialized = false;
            this.logger.log('Temporal Schedule Service shut down successfully');
        } catch (error) {
            this.logger.error(
                `Error during schedule service shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Initialize the schedule client
     */
    private async initializeScheduleClient(): Promise<void> {
        try {
            // Check if the client has schedule support
            if (this.client?.schedule) {
                this.scheduleClient = this.client.schedule;
                this.temporalLogger.debug('Schedule client initialized from existing client');
            } else {
                // Try to create a new schedule client if none exists
                try {
                    this.scheduleClient = new ScheduleClient({
                        connection: this.client.connection,
                        namespace: this.options.connection?.namespace || 'default',
                    });
                    this.temporalLogger.debug('Schedule client initialized successfully');
                } catch (error) {
                    this.logger.warn(
                        `Schedule client not available: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    );
                    this.scheduleClient = undefined;
                }
            }
        } catch (error) {
            this.logger.error(
                `Failed to initialize schedule client: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            this.scheduleClient = undefined;
        }
    }

    /**
     * Discover and register scheduled workflows
     */
    private async discoverAndRegisterSchedules(): Promise<void> {
        try {
            const providers = this.discoveryService.getProviders();
            const scheduledCount = 0;

            for (const provider of providers) {
                const { instance, metatype } = provider;
                if (!instance || !metatype) continue;

                // Check for scheduled workflows
                // TODO: Add schedule metadata support when schedule decorators are implemented
                // Skip for now as schedule decorators are not yet implemented
            }

            this.temporalLogger.debug(
                `Discovered and registered ${scheduledCount} scheduled workflows`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to discover schedules: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw error;
        }
    }

    /**
     * Register a scheduled workflow
     */
    private async registerScheduledWorkflow(
        instance: any,
        metatype: Function,
        scheduleMetadata: any,
    ): Promise<void> {
        try {
            const scheduleId = scheduleMetadata.scheduleId || `${metatype.name}-schedule`;
            const workflowType = scheduleMetadata.workflowType || metatype.name;

            const scheduleSpec = this.buildScheduleSpec(scheduleMetadata);
            const workflowOptions = this.buildWorkflowOptions(scheduleMetadata);

            // Create the schedule
            const scheduleHandle = await this.scheduleClient!.create({
                scheduleId,
                spec: scheduleSpec,
                action: {
                    type: 'startWorkflow',
                    workflowType,
                    taskQueue: scheduleMetadata.taskQueue || 'default',
                    args: scheduleMetadata.args || [],
                    ...workflowOptions,
                } as any,
                memo: scheduleMetadata.memo || {},
                searchAttributes: scheduleMetadata.searchAttributes || {},
            });

            this.scheduleHandles.set(scheduleId, scheduleHandle);

            this.temporalLogger.debug(
                `Registered scheduled workflow: ${scheduleId} with type: ${workflowType}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to register scheduled workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Build schedule specification from metadata
     */
    private buildScheduleSpec(scheduleMetadata: any): Record<string, unknown> {
        const spec: Record<string, unknown> = {};

        // Handle cron schedules
        if (scheduleMetadata.cron) {
            spec.cronExpressions = Array.isArray(scheduleMetadata.cron)
                ? scheduleMetadata.cron
                : [scheduleMetadata.cron];
        }

        // Handle interval schedules
        if (scheduleMetadata.interval) {
            spec.intervals = Array.isArray(scheduleMetadata.interval)
                ? scheduleMetadata.interval.map(this.parseInterval)
                : [this.parseInterval(scheduleMetadata.interval)];
        }

        // Handle calendar schedules
        if (scheduleMetadata.calendar) {
            spec.calendars = Array.isArray(scheduleMetadata.calendar)
                ? scheduleMetadata.calendar
                : [scheduleMetadata.calendar];
        }

        // Handle timezone
        if (scheduleMetadata.timezone) {
            spec.timeZone = scheduleMetadata.timezone;
        }

        // Handle jitter
        if (scheduleMetadata.jitter) {
            spec.jitter = scheduleMetadata.jitter;
        }

        return spec;
    }

    /**
     * Build workflow options from metadata
     */
    private buildWorkflowOptions(scheduleMetadata: any): Record<string, unknown> {
        const options: Record<string, unknown> = {};

        if (scheduleMetadata.taskQueue) {
            options.taskQueue = scheduleMetadata.taskQueue;
        }

        if (scheduleMetadata.workflowId) {
            options.workflowId = scheduleMetadata.workflowId;
        }

        if (scheduleMetadata.workflowExecutionTimeout) {
            options.workflowExecutionTimeout = scheduleMetadata.workflowExecutionTimeout;
        }

        if (scheduleMetadata.workflowRunTimeout) {
            options.workflowRunTimeout = scheduleMetadata.workflowRunTimeout;
        }

        if (scheduleMetadata.workflowTaskTimeout) {
            options.workflowTaskTimeout = scheduleMetadata.workflowTaskTimeout;
        }

        if (scheduleMetadata.retryPolicy) {
            options.retryPolicy = scheduleMetadata.retryPolicy;
        }

        if (scheduleMetadata.args) {
            options.args = scheduleMetadata.args;
        }

        return options;
    }

    /**
     * Parse interval string to Temporal interval format
     */
    private parseInterval(interval: string | number): Record<string, unknown> {
        if (typeof interval === 'number') {
            return { every: `${interval}ms` };
        }

        // Handle various interval formats
        const intervalStr = interval.toString().toLowerCase();

        if (intervalStr.includes('ms')) {
            return { every: intervalStr };
        }

        if (intervalStr.includes('s')) {
            return { every: intervalStr };
        }

        if (intervalStr.includes('m')) {
            return { every: intervalStr };
        }

        if (intervalStr.includes('h')) {
            return { every: intervalStr };
        }

        // Default to milliseconds if no unit specified
        return { every: `${interval}ms` };
    }

    /**
     * Create a new schedule
     */
    async createSchedule(options: {
        scheduleId: string;
        spec: any;
        action: any;
        memo?: Record<string, any>;
        searchAttributes?: Record<string, any>;
    }): Promise<ScheduleHandle> {
        this.ensureInitialized();

        try {
            const scheduleHandle = await this.scheduleClient!.create(options);
            this.scheduleHandles.set(options.scheduleId, scheduleHandle);

            this.temporalLogger.debug(`Created schedule: ${options.scheduleId}`);

            return scheduleHandle;
        } catch (error) {
            this.logger.error(
                `Failed to create schedule ${options.scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw new Error(
                `Failed to create schedule '${options.scheduleId}': ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Get a schedule handle
     */
    async getSchedule(scheduleId: string): Promise<ScheduleHandle | undefined> {
        this.ensureInitialized();

        try {
            // Check local cache first
            let scheduleHandle = this.scheduleHandles.get(scheduleId);

            if (!scheduleHandle) {
                // Try to get from Temporal
                scheduleHandle = this.scheduleClient!.getHandle(scheduleId);
                this.scheduleHandles.set(scheduleId, scheduleHandle);
            }

            return scheduleHandle;
        } catch (error) {
            this.logger.error(
                `Failed to get schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return undefined;
        }
    }

    /**
     * Update a schedule
     */
    async updateSchedule(
        scheduleId: string,
        updater: (schedule: Record<string, unknown>) => void,
    ): Promise<void> {
        this.ensureInitialized();

        try {
            const scheduleHandle = await this.getSchedule(scheduleId);
            if (!scheduleHandle) {
                throw new Error(`Schedule ${scheduleId} not found`);
            }

            await scheduleHandle.update((schedule) => {
                updater(schedule as any);
                return {
                    spec: schedule.spec || {},
                    action: schedule.action || {},
                    state: schedule.state || {},
                    policies: schedule.policies || {},
                } as any;
            });

            this.temporalLogger.debug(`Updated schedule: ${scheduleId}`);
        } catch (error) {
            this.logger.error(
                `Failed to update schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw new Error(
                `Failed to update schedule '${scheduleId}': ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Delete a schedule
     */
    async deleteSchedule(scheduleId: string): Promise<void> {
        this.ensureInitialized();

        try {
            const scheduleHandle = await this.getSchedule(scheduleId);
            if (!scheduleHandle) {
                throw new Error(`Schedule ${scheduleId} not found`);
            }

            await scheduleHandle.delete();
            this.scheduleHandles.delete(scheduleId);

            this.temporalLogger.debug(`Deleted schedule: ${scheduleId}`);
        } catch (error) {
            this.logger.error(
                `Failed to delete schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw new Error(
                `Failed to delete schedule '${scheduleId}': ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Pause a schedule
     */
    async pauseSchedule(scheduleId: string, note?: string): Promise<void> {
        this.ensureInitialized();

        try {
            const scheduleHandle = await this.getSchedule(scheduleId);
            if (!scheduleHandle) {
                throw new Error(`Schedule ${scheduleId} not found`);
            }

            await scheduleHandle.pause(note || 'Paused via NestJS Temporal integration');

            this.temporalLogger.debug(`Paused schedule: ${scheduleId}`);
        } catch (error) {
            this.logger.error(
                `Failed to pause schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw new Error(
                `Failed to pause schedule '${scheduleId}': ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Unpause a schedule
     */
    async unpauseSchedule(scheduleId: string, note?: string): Promise<void> {
        this.ensureInitialized();

        try {
            const scheduleHandle = await this.getSchedule(scheduleId);
            if (!scheduleHandle) {
                throw new Error(`Schedule ${scheduleId} not found`);
            }

            await scheduleHandle.unpause(note || 'Resumed via NestJS Temporal integration');

            this.temporalLogger.debug(`Unpaused schedule: ${scheduleId}`);
        } catch (error) {
            this.logger.error(
                `Failed to unpause schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw new Error(
                `Failed to resume schedule '${scheduleId}': ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Trigger a schedule immediately
     */
    async triggerSchedule(
        scheduleId: string,
        overlap?:
            | 'skip'
            | 'buffer_one'
            | 'buffer_all'
            | 'cancel_other'
            | 'terminate_other'
            | 'allow_all',
    ): Promise<void> {
        this.ensureInitialized();

        try {
            const scheduleHandle = await this.getSchedule(scheduleId);
            if (!scheduleHandle) {
                throw new Error(`Schedule ${scheduleId} not found`);
            }

            // Convert overlap policy to uppercase format expected by Temporal
            const temporalOverlap = overlap
                ? ({
                      skip: 'SKIP',
                      buffer_one: 'BUFFER_ONE',
                      buffer_all: 'BUFFER_ALL',
                      cancel_other: 'CANCEL_OTHER',
                      terminate_other: 'TERMINATE_OTHER',
                      allow_all: 'ALLOW_ALL',
                  }[overlap] as any)
                : 'ALLOW_ALL';

            await scheduleHandle.trigger(temporalOverlap);

            this.temporalLogger.debug(`Triggered schedule: ${scheduleId}`);
        } catch (error) {
            this.logger.error(
                `Failed to trigger schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw new Error(
                `Failed to trigger schedule '${scheduleId}': ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Get schedule description
     */
    async describeSchedule(scheduleId: string): Promise<Record<string, unknown>> {
        this.ensureInitialized();

        try {
            const scheduleHandle = await this.getSchedule(scheduleId);
            if (!scheduleHandle) {
                throw new Error(`Schedule ${scheduleId} not found`);
            }

            return await scheduleHandle.describe();
        } catch (error) {
            this.logger.error(
                `Failed to describe schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw new Error(
                `Failed to describe schedule '${scheduleId}': ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * List all schedule handles
     */
    getScheduleHandles(): Map<string, ScheduleHandle> {
        return new Map(this.scheduleHandles);
    }

    /**
     * Check if service is healthy
     */
    isHealthy(): boolean {
        return this.isInitialized;
    }

    /**
     * Get schedule statistics
     */
    getScheduleStats(): { total: number; active: number; inactive: number; errors: number } {
        return {
            total: this.scheduleHandles.size,
            active: this.scheduleHandles.size,
            inactive: 0,
            errors: 0,
        };
    }

    /**
     * Get service status
     */
    getStatus(): {
        available: boolean;
        healthy: boolean;
        schedulesSupported: boolean;
    } {
        return {
            available: this.isInitialized,
            healthy: this.isHealthy(),
            schedulesSupported: !!this.scheduleClient,
        };
    }

    /**
     * Get service health status
     */
    getHealth(): {
        status: 'healthy' | 'unhealthy';
        schedulesCount: number;
        isInitialized: boolean;
        details: Record<string, unknown>;
    } {
        return {
            status: this.isInitialized ? 'healthy' : 'unhealthy',
            schedulesCount: this.scheduleHandles.size,
            isInitialized: this.isInitialized,
            details: {
                scheduleIds: Array.from(this.scheduleHandles.keys()),
                hasScheduleClient: !!this.scheduleClient,
            },
        };
    }

    /**
     * Ensure service is initialized
     */
    private ensureInitialized(): void {
        if (!this.isInitialized) {
            throw new Error('Temporal Schedule Service is not initialized');
        }
    }

    /**
     * Create a cron schedule (alias for createSchedule with cron expression)
     */
    async createCronSchedule(
        id: string,
        cronExpression: string,
        workflowType: string,
        taskQueue: string,
        args: unknown[] = [],
        options?: Record<string, unknown>,
    ): Promise<ScheduleHandle> {
        try {
            const { timezone, description, overlapPolicy, startPaused, ...otherOptions } =
                options || {};

            return await this.createSchedule({
                scheduleId: id,
                spec: {
                    cronExpressions: [cronExpression],
                    ...(timezone ? { timeZone: timezone } : {}),
                },
                action: {
                    type: 'startWorkflow',
                    workflowType,
                    args,
                    taskQueue,
                    ...otherOptions,
                },
                memo: description ? { description } : {},
                searchAttributes: overlapPolicy
                    ? { overlap: overlapPolicy.toString().toUpperCase() }
                    : {},
            });
        } catch (error) {
            if (error instanceof Error && error.message.includes('Failed to create schedule')) {
                throw new Error(
                    `Failed to create cron schedule '${id}': ${error.message.split(': ')[1]}`,
                );
            }
            throw new Error(
                `Failed to create cron schedule '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Create an interval schedule
     */
    async createIntervalSchedule(
        id: string,
        interval: string,
        workflowType: string,
        taskQueue: string,
        args: unknown[] = [],
        options?: Record<string, unknown>,
    ): Promise<ScheduleHandle> {
        try {
            const { description, overlapPolicy, startPaused, ...otherOptions } = options || {};

            return await this.createSchedule({
                scheduleId: id,
                spec: {
                    intervals: [{ every: interval }],
                },
                action: {
                    type: 'startWorkflow',
                    workflowType,
                    args,
                    taskQueue,
                    ...otherOptions,
                },
                memo: description ? { description } : {},
                searchAttributes: overlapPolicy
                    ? { overlap: overlapPolicy.toString().toUpperCase() }
                    : {},
            });
        } catch (error) {
            if (error instanceof Error && error.message.includes('Failed to create schedule')) {
                throw new Error(
                    `Failed to create interval schedule '${id}': ${error.message.split(': ')[1]}`,
                );
            }
            throw new Error(
                `Failed to create interval schedule '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Resume a paused schedule
     */
    async resumeSchedule(scheduleId: string, note?: string): Promise<void> {
        this.ensureInitialized();

        try {
            const scheduleHandle = await this.getSchedule(scheduleId);
            if (!scheduleHandle) {
                throw new Error(`Schedule ${scheduleId} not found`);
            }

            await scheduleHandle.update((schedule) => {
                return {
                    ...schedule,
                    state: {
                        ...schedule.state,
                        paused: false,
                    },
                } as any;
            });

            this.temporalLogger.info(`Schedule resumed: ${scheduleId}${note ? ` - ${note}` : ''}`);
        } catch (error) {
            this.logger.error(
                `Failed to resume schedule ${scheduleId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw error;
        }
    }

    /**
     * List all schedules
     */
    async listSchedules(maxItems: number = 100): Promise<Array<{ id: string; state: unknown }>> {
        this.ensureInitialized();

        try {
            const schedules = await this.scheduleClient!.list({ pageSize: maxItems });
            const result: Array<{ id: string; state: unknown }> = [];
            let count = 0;

            for await (const schedule of schedules) {
                if (count >= maxItems) break;
                result.push({
                    id: (schedule as any).id || 'unknown',
                    state: (schedule as any).state || {},
                });
                count++;
            }

            return result;
        } catch (error) {
            this.logger.error(
                `Failed to list schedules: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw new Error(
                `Failed to list schedules: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Check if a schedule exists
     */
    async scheduleExists(scheduleId: string): Promise<boolean> {
        this.ensureInitialized();

        try {
            const schedules = await this.scheduleClient!.list({ pageSize: 1000 });
            let count = 0;

            for await (const schedule of schedules) {
                if (count >= 1000) break;
                if ((schedule as any).id === scheduleId) {
                    return true;
                }
                count++;
            }

            return false;
        } catch (error) {
            this.logger.warn(`Failed to check schedule existence for '${scheduleId}': ${error}`);
            return false;
        }
    }

    /**
     * Get the schedule client
     */
    getScheduleClient(): ScheduleClient | undefined {
        return this.scheduleClient;
    }

    /**
     * Generate a scheduled workflow ID
     */
    private generateScheduledWorkflowId(scheduleId: string): string {
        return `${scheduleId}-${Date.now()}`;
    }

    /**
     * Execute a schedule operation
     */
    private async executeScheduleOperation(
        scheduleId: string,
        operation: string,
        action: () => Promise<unknown>,
    ): Promise<unknown> {
        try {
            return await action();
        } catch (error) {
            this.logger.error(
                `Failed to execute ${operation} on schedule '${scheduleId}': ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw error;
        }
    }

    /**
     * Ensure client is initialized
     */
    private ensureClientInitialized(): void {
        if (!this.scheduleClient) {
            throw new Error('Schedule client not initialized');
        }
    }
}
