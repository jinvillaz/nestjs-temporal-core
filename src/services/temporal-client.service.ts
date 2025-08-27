import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { Client, WorkflowHandle, WorkflowClient } from '@temporalio/client';
import { TEMPORAL_CLIENT, TEMPORAL_MODULE_OPTIONS } from '../constants';
import { TemporalOptions, WorkflowStartOptions } from '../interfaces';
import { createLogger, TemporalLogger } from '../utils/logger';

/**
 * Temporal Client Service
 *
 * Provides a clean interface for Temporal client operations including:
 * - Workflow execution (start, terminate, cancel)
 * - Signal and query operations
 * - Workflow handle management
 * - Client health monitoring
 *
 * @example
 * ```typescript
 * // Start a workflow
 * const handle = await clientService.startWorkflow('myWorkflow', { data: 'example' });
 *
 * // Send a signal
 * await clientService.signalWorkflow(handle, 'updateData', 'new data');
 *
 * // Query workflow state
 * const result = await clientService.queryWorkflow(handle, 'getStatus');
 * ```
 */
@Injectable()
export class TemporalClientService implements OnModuleInit {
    private readonly logger: TemporalLogger;
    private client: Client | null = null;
    private isInitialized = false;
    private lastHealthCheck: Date | null = null;
    private healthCheckInterval: number = 30000; // 30 seconds

    constructor(
        @Inject(TEMPORAL_CLIENT)
        private readonly temporalClient: Client | null,
        @Inject(TEMPORAL_MODULE_OPTIONS)
        private readonly options: TemporalOptions,
    ) {
        this.logger = createLogger(TemporalClientService.name, {
            enableLogger: options.enableLogger,
            logLevel: options.logLevel,
        });
    }

    async onModuleInit(): Promise<void> {
        try {
            this.client = this.temporalClient;

            if (this.client) {
                this.isInitialized = true;
                this.logger.info('Temporal client service initialized successfully');
                this.logger.debug(
                    `Client namespace: ${this.options?.connection?.namespace || 'default'}`,
                );

                // Perform initial health check
                await this.performHealthCheck();
            } else {
                this.logger.warn('No Temporal client available - running in client-less mode');
            }
        } catch (error) {
            this.logger.error('Failed to initialize Temporal client service', error);
            throw error;
        }
    }

    // ==========================================
    // Workflow Operations
    // ==========================================

    /**
     * Start a new workflow execution
     */
    async startWorkflow(
        workflowType: string,
        args: unknown[] = [],
        options?: WorkflowStartOptions & { signal?: { name: string; args?: unknown[] } },
    ): Promise<any> {
        this.ensureClientAvailable();

        const workflowId = options?.workflowId || this.generateWorkflowId(workflowType);
        const taskQueue = options?.taskQueue || this.options.taskQueue || 'default';

        try {
            const handle = await this.client!.workflow.start(workflowType, {
                workflowId,
                taskQueue,
                args,
                searchAttributes: options?.searchAttributes as any,
                memo: options?.memo,
            } as any);

            // Send initial signal if provided
            if (options?.signal?.name) {
                if (options.signal.args && options.signal.args.length > 0) {
                    await (handle as any).signal(options.signal.name, ...options.signal.args);
                } else {
                    await (handle as any).signal(options.signal.name);
                }
            }

            this.logger.info(
                `Started workflow: ${workflowType} [${workflowId}] on queue: ${taskQueue}`,
            );
            return { ...(handle as any), handle };
        } catch (error) {
            const message = this.extractErrorMessage(error);
            this.logger.error(`Failed to start workflow '${workflowType}': ${message}`, error);
            throw new Error(`Failed to start workflow '${workflowType}': ${message}`);
        }
    }

    /**
     * Get handle to an existing workflow
     */
    async getWorkflowHandle(workflowId: string, runId?: string): Promise<WorkflowHandle> {
        this.ensureClientAvailable();

        try {
            const handle = await (this.client as Client).workflow.getHandle(workflowId, runId);
            this.logger.debug(
                `Retrieved workflow handle: ${workflowId}${runId ? ` (run: ${runId})` : ''}`,
            );
            return handle as any;
        } catch (error) {
            const message = this.extractErrorMessage(error);
            this.logger.error(`Failed to get workflow handle for ${workflowId}: ${message}`, error);
            throw new Error(`Failed to get workflow handle for ${workflowId}: ${message}`);
        }
    }

    /**
     * Terminate a workflow execution
     */
    async terminateWorkflow(workflowId: string, reason?: string, runId?: string): Promise<void> {
        try {
            const handle = await this.getWorkflowHandle(workflowId, runId);
            await (handle as any).terminate(reason);

            this.logger.info(`Terminated workflow: ${workflowId}${reason ? ` (${reason})` : ''}`);
        } catch (error) {
            const message = this.extractErrorMessage(error);
            this.logger.error(`Failed to terminate workflow ${workflowId}: ${message}`, error);
            throw new Error(`Failed to terminate workflow ${workflowId}: ${message}`);
        }
    }

    /**
     * Cancel a workflow execution
     */
    async cancelWorkflow(workflowId: string, runId?: string): Promise<void> {
        try {
            const handle = await this.getWorkflowHandle(workflowId, runId);
            await (handle as any).cancel();

            this.logger.info(`Cancelled workflow: ${workflowId}`);
        } catch (error) {
            const message = this.extractErrorMessage(error);
            this.logger.error(`Failed to cancel workflow ${workflowId}: ${message}`, error);
            throw new Error(`Failed to cancel workflow ${workflowId}: ${message}`);
        }
    }

    // ==========================================
    // Signal Operations
    // ==========================================

    /**
     * Send a signal to a workflow
     */
    async signalWorkflow(
        workflowId: string,
        signalName: string,
        args?: unknown[],
        runId?: string,
    ): Promise<void> {
        try {
            const handle = await this.getWorkflowHandle(workflowId, runId);
            await (handle as any).signal(signalName, ...(args || []));

            this.logger.debug(`Sent signal '${signalName}' to workflow: ${workflowId}`);
        } catch (error) {
            const message = this.extractErrorMessage(error);
            this.logger.error(
                `Failed to send signal '${signalName}' to workflow ${workflowId}: ${message}`,
                error,
            );
            throw new Error(
                `Failed to send signal '${signalName}' to workflow ${workflowId}: ${message}`,
            );
        }
    }

    /**
     * Send a signal using workflow handle
     */
    async signalWorkflowHandle(
        handle: WorkflowHandle,
        signalName: string,
        args?: unknown[],
    ): Promise<void> {
        try {
            await (handle as any).signal(signalName, ...(args || []));
            this.logger.debug(`Sent signal '${signalName}' to workflow handle`);
        } catch (error) {
            this.logger.error(
                `Failed to send signal '${signalName}': ${this.extractErrorMessage(error)}`,
                error,
            );
            throw error;
        }
    }

    // ==========================================
    // Query Operations
    // ==========================================

    /**
     * Query a workflow for its current state
     */
    async queryWorkflow<T = any>(
        workflowId: string,
        queryName: string,
        args?: unknown[],
        runId?: string,
    ): Promise<T> {
        try {
            const handle = await this.getWorkflowHandle(workflowId, runId);
            const result = await (handle as any).query(queryName, ...(args || []));

            this.logger.debug(`Queried '${queryName}' from workflow: ${workflowId}`);
            return result as T;
        } catch (error) {
            const message = this.extractErrorMessage(error);
            this.logger.error(
                `Failed to query '${queryName}' on workflow ${workflowId}: ${message}`,
                error,
            );
            throw new Error(`Failed to query '${queryName}' on workflow ${workflowId}: ${message}`);
        }
    }

    /**
     * Query a workflow using handle
     */
    async queryWorkflowHandle<T = any>(
        handle: WorkflowHandle,
        queryName: string,
        args?: unknown[],
    ): Promise<T> {
        try {
            const result = await (handle as any).query(queryName, ...(args || []));
            this.logger.debug(`Queried '${queryName}' from workflow handle`);
            return result as T;
        } catch (error) {
            this.logger.error(
                `Failed to query '${queryName}': ${this.extractErrorMessage(error)}`,
                error,
            );
            throw error;
        }
    }

    // ==========================================
    // Workflow Result Operations
    // ==========================================

    /**
     * Wait for workflow completion and get result
     */
    async getWorkflowResult<T = any>(workflowId: string, runId?: string): Promise<T> {
        try {
            const handle = await this.getWorkflowHandle(workflowId, runId);
            const result = await (handle as any).result();

            this.logger.debug(`Retrieved result from workflow: ${workflowId}`);
            return result as T;
        } catch (error) {
            this.logger.error(
                `Failed to get result from ${workflowId}: ${this.extractErrorMessage(error)}`,
                error,
            );
            throw error;
        }
    }

    /**
     * Describe workflow execution
     */
    async describeWorkflow(workflowId: string, runId?: string) {
        try {
            const handle = await this.getWorkflowHandle(workflowId, runId);
            const description = await (handle as any).describe();

            this.logger.debug(`Retrieved description for workflow: ${workflowId}`);
            return description;
        } catch (error) {
            const message = this.extractErrorMessage(error);
            this.logger.error(`Failed to describe workflow ${workflowId}: ${message}`, error);
            throw new Error(`Failed to describe workflow ${workflowId}: ${message}`);
        }
    }

    // ==========================================
    // Listing and Client Access
    // ==========================================

    listWorkflows(query: string, pageSize = 100): unknown {
        this.ensureClientAvailable();
        try {
            return (this.client as any).workflow.list({ query, pageSize });
        } catch (error) {
            const message = this.extractErrorMessage(error);
            throw new Error(`Failed to list workflows with query '${query}': ${message}`);
        }
    }

    getWorkflowClient(): WorkflowClient | null {
        return (this.client && (this.client as any).workflow) || null;
    }

    // ==========================================
    // Health and Status
    // ==========================================

    /**
     * Check if client is available and healthy
     */
    isHealthy(): boolean {
        if (!this.isInitialized || !this.client) {
            return false;
        }

        // Check if health check is due
        const now = new Date();
        if (
            !this.lastHealthCheck ||
            now.getTime() - this.lastHealthCheck.getTime() > this.healthCheckInterval
        ) {
            // Perform async health check
            this.performHealthCheck().catch((error) => {
                this.logger.warn('Health check failed', error);
            });
        }

        return Boolean((this.client as any).workflow);
    }

    /**
     * Get client health status
     */
    getHealth(): { status: 'healthy' | 'unhealthy' | 'degraded' } {
        return { status: this.isHealthy() ? 'healthy' : 'unhealthy' };
    }

    /**
     * Get client status for monitoring
     */
    getStatus() {
        return {
            available: this.client !== null,
            healthy: this.isHealthy(),
            initialized: this.isInitialized,
            lastHealthCheck: this.lastHealthCheck,
            namespace: this.options.connection?.namespace || 'default',
        };
    }

    /**
     * Get raw Temporal client (use with caution)
     */
    getRawClient(): Client | null {
        return this.client;
    }

    /**
     * Perform health check on the client
     */
    private async performHealthCheck(): Promise<void> {
        if (!this.client) {
            return;
        }

        try {
            // Simple health check - try to access workflow property
            const hasWorkflow = Boolean((this.client as any).workflow);
            if (hasWorkflow) {
                this.lastHealthCheck = new Date();
                this.logger.debug('Client health check passed');
            } else {
                this.logger.warn('Client health check failed - workflow property not available');
            }
        } catch (error) {
            this.logger.warn('Client health check failed', error);
        }
    }

    // ==========================================
    // Private Helper Methods
    // ==========================================

    private ensureClientAvailable(): void {
        if (!this.client) {
            throw new Error('Temporal client not initialized');
        }
    }

    private generateWorkflowId(workflowType: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${workflowType}-${timestamp}-${random}`;
    }

    private extractErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return 'Unknown error';
    }
}
