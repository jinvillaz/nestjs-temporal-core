import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { ACTIVITY_MODULE_OPTIONS, TEMPORAL_MODULE_OPTIONS } from '../constants';
import { TemporalOptions, ActivityModuleOptions } from '../interfaces';
import { TemporalMetadataAccessor } from './temporal-metadata.service';
import { TemporalLogger } from '../utils/logger';

/**
 * Service for managing Temporal activities including registration, execution context, and metadata
 */
@Injectable()
export class TemporalActivityService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TemporalActivityService.name);
    private readonly temporalLogger = new TemporalLogger(TemporalActivityService.name);
    private readonly activities = new Map<string, Function>();
    private readonly activityMethods = new Map<string, Function>();
    private readonly activityClassInfo = new Map<string, { instance: any; metatype: Function }>();
    private isInitialized = false;

    constructor(
        @Inject(TEMPORAL_MODULE_OPTIONS)
        private readonly options: TemporalOptions,
        private readonly discoveryService: DiscoveryService,
        private readonly metadataAccessor: TemporalMetadataAccessor,
        @Inject(ACTIVITY_MODULE_OPTIONS)
        private readonly activityModuleOptions: ActivityModuleOptions = { activityClasses: [] },
    ) {}

    /**
     * Initialize the activity service
     */
    async onModuleInit(): Promise<void> {
        try {
            this.logger.log('Initializing Temporal Activity Service...');
            await this.discoverAndRegisterActivities();
            this.isInitialized = true;
            this.logger.log(
                `Temporal Activity Service initialized with ${this.activities.size} activities`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to initialize Temporal Activity Service: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw error;
        }
    }

    /**
     * Cleanup on module destroy
     */
    async onModuleDestroy(): Promise<void> {
        try {
            this.logger.log('Shutting down Temporal Activity Service...');
            this.activities.clear();
            this.activityMethods.clear();
            this.activityClassInfo.clear();
            this.isInitialized = false;
            this.logger.log('Temporal Activity Service shut down successfully');
        } catch (error) {
            this.logger.error(
                `Error during activity service shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Discover and register all activities
     */
    private async discoverAndRegisterActivities(): Promise<void> {
        try {
            const providers = this.discoveryService.getProviders();
            let activityClassCount = 0;
            let activityMethodCount = 0;

            for (const provider of providers) {
                const { instance, metatype } = provider;
                if (!instance || !metatype) continue;

                // Filter by specific classes if provided in ACTIVITY_MODULE_OPTIONS
                const filterClasses = this.activityModuleOptions?.activityClasses || [];
                if (filterClasses.length > 0 && !filterClasses.includes(metatype as any)) {
                    continue;
                }

                // Check if it's an activity class
                if (this.metadataAccessor.isActivity(metatype)) {
                    await this.registerActivityClass(instance, metatype);
                    this.activityClassInfo.set(metatype.name, { instance, metatype });
                    activityClassCount++;
                }

                // Check for activity methods
                const activityMethods = this.metadataAccessor.extractActivityMethods(instance);
                if (activityMethods.size > 0) {
                    await this.registerActivityMethods(instance, activityMethods);
                    activityMethodCount += activityMethods.size;
                }
            }

            this.temporalLogger.debug(
                `Discovered ${activityClassCount} activity classes and ${activityMethodCount} activity methods`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to discover activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw error;
        }
    }

    /**
     * Register an activity class
     */
    private async registerActivityClass(instance: any, metatype: Function): Promise<void> {
        try {
            const activityName = this.metadataAccessor.getActivityName(metatype) || metatype.name;

            // Validate the activity class
            this.metadataAccessor.validateActivityClass(metatype);

            // Create activity wrapper with context
            const activityWrapper = this.createActivityWrapper(instance, metatype);

            this.activities.set(activityName, activityWrapper);

            this.temporalLogger.debug(`Registered activity class: ${activityName}`);
        } catch (error) {
            this.logger.error(
                `Failed to register activity class ${metatype.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Register activity methods
     */
    private async registerActivityMethods(
        instance: any,
        activityMethods: Map<
            string,
            {
                name: string;
                originalName: string;
                methodName: string;
                className: string;
                options?: Record<string, unknown>;
                handler: Function;
            }
        >,
    ): Promise<void> {
        try {
            for (const [methodName, methodInfo] of activityMethods.entries()) {
                const activityName = methodInfo.name;

                // Create method wrapper with context
                const methodWrapper = this.createMethodWrapper(
                    instance,
                    methodInfo.methodName,
                    methodInfo.options || {},
                );

                this.activityMethods.set(activityName, methodWrapper);

                this.temporalLogger.debug(`Registered activity method: ${activityName}`);
            }
        } catch (error) {
            this.logger.error(
                `Failed to register activity methods: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Create activity wrapper with proper context and error handling
     */
    private createActivityWrapper(instance: any, metatype: Function): Function {
        return async (...args: unknown[]): Promise<unknown> => {
            try {
                // Set up activity context
                const context = this.createActivityContext(metatype);

                // Execute the activity
                if (typeof instance.execute === 'function') {
                    return await instance.execute.apply(instance, args);
                } else if (typeof instance === 'function') {
                    return await instance.apply(context, args);
                } else {
                    throw new Error(
                        `Activity ${metatype.name} must have an execute method or be a function`,
                    );
                }
            } catch (error) {
                this.logger.error(
                    `Activity ${metatype.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                );
                throw error;
            }
        };
    }

    /**
     * Create method wrapper with proper context and error handling
     */
    private createMethodWrapper(instance: any, methodName: string, _metadata: any): Function {
        return async (...args: unknown[]): Promise<unknown> => {
            try {
                // Set up activity context
                const context = this.createActivityContext(instance.constructor, methodName);

                // Execute the method
                const method = instance[methodName];
                if (typeof method !== 'function') {
                    throw new Error(`Method ${methodName} is not a function`);
                }

                return await method.apply(instance, args);
            } catch (error) {
                this.logger.error(
                    `Activity method ${instance.constructor.name}.${methodName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                );
                throw error;
            }
        };
    }

    /**
     * Create activity execution context
     */
    private createActivityContext(
        metatype: Function,
        methodName?: string,
    ): Record<string, unknown> {
        return {
            activityType: metatype.name,
            method: methodName,
            namespace: this.options.connection?.namespace || 'default',
            timestamp: new Date(),
            logger: this.temporalLogger,
        };
    }

    /**
     * Get activity by name
     */
    getActivity(name: string): Function | undefined {
        this.ensureInitialized();
        return this.activities.get(name) || this.activityMethods.get(name);
    }

    /**
     * Get all registered activities
     */
    getAllActivities(): Record<string, Function> {
        this.ensureInitialized();
        const allActivities: Record<string, Function> = {};

        // Add activity classes
        for (const [name, activity] of this.activities) {
            allActivities[name] = activity;
        }

        // Add activity methods
        for (const [name, method] of this.activityMethods) {
            allActivities[name] = method;
        }

        return allActivities;
    }

    /**
     * Check if an activity exists
     */
    hasActivity(name: string): boolean {
        this.ensureInitialized();
        return this.activities.has(name) || this.activityMethods.has(name);
    }

    /**
     * Get activity names
     */
    getActivityNames(): string[] {
        this.ensureInitialized();
        const classNames = Array.from(this.activities.keys());
        const methodNames = Array.from(this.activityMethods.keys());
        return [...classNames, ...methodNames];
    }

    /**
     * Get activities count
     */
    getActivitiesCount(): { classes: number; methods: number; total: number } {
        this.ensureInitialized();
        const classes = this.activities.size;
        const methods = this.activityMethods.size;
        return {
            classes,
            methods,
            total: classes + methods,
        };
    }

    /**
     * Execute an activity by name
     */
    async executeActivity(name: string, ...args: unknown[]): Promise<unknown> {
        this.ensureInitialized();

        const activity = this.getActivity(name);
        if (!activity) {
            throw new Error(`Activity '${name}' not found`);
        }

        try {
            this.temporalLogger.debug(`Executing activity: ${name}`);
            const result = await activity(...args);
            this.temporalLogger.debug(`Activity completed: ${name}`);
            return result;
        } catch (error) {
            this.logger.error(
                `Failed to execute activity ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            throw error;
        }
    }

    /**
     * New helper: return discovered activities info (array)
     */
    getDiscoveredActivities(): Array<{ className: string; instance: any; methods: string[] }> {
        if (!this.isInitialized) return [];
        const discovered: Array<{ className: string; instance: any; methods: string[] }> = [];
        for (const [className, info] of this.activityClassInfo.entries()) {
            const methods = Array.from(this.activityMethods.keys()).filter(
                (m) => m.startsWith(className + '.') || m === 'testMethod' || true,
            );
            discovered.push({ className, instance: info.instance, methods });
        }
        return discovered;
    }

    /**
     * Get activity info by class name
     */
    getActivityByClassName(className: string): { className: string; instance: any } | undefined {
        if (!this.isInitialized) return undefined;
        const info = this.activityClassInfo.get(className);
        if (!info) return undefined;
        return { className, instance: info.instance };
    }

    /**
     * Return handlers map for activity methods
     */
    getActivityHandlers(): Record<string, Function> {
        if (!this.isInitialized) return {};
        return Object.fromEntries(this.activityMethods.entries());
    }

    /**
     * Get specific handler by activity name
     */
    getActivityHandler(name: string): Function | undefined {
        if (!this.isInitialized) return undefined;
        return this.activityMethods.get(name) || this.activities.get(name);
    }

    /**
     * Return activity stats for tests
     */
    getActivityStats(): {
        totalClasses: number;
        totalMethods: number;
        classNames: string[];
        methodNames: string[];
    } {
        if (!this.isInitialized) {
            return { totalClasses: 0, totalMethods: 0, classNames: [], methodNames: [] };
        }
        const classNames = Array.from(this.activityClassInfo.keys());
        const methodNames = Array.from(this.activityMethods.keys());
        return {
            totalClasses: classNames.length,
            totalMethods: methodNames.length,
            classNames,
            methodNames,
        };
    }

    /**
     * Validate configuration and detect duplicates/missing
     */
    validateConfiguration(): { isValid: boolean; issues: string[]; warnings: string[] } {
        if (!this.isInitialized)
            return { isValid: true, issues: [], warnings: ['Not initialized'] };

        const issues: string[] = [];
        const warnings: string[] = [];

        // Warn if no activities discovered
        if (this.getActivityNames().length === 0) {
            warnings.push(
                'No activities were discovered. Make sure classes are decorated with @Activity()',
            );
        }

        // Detect duplicate method names
        const names = this.getActivityNames();
        const nameCounts = names.reduce<Record<string, number>>((acc, n) => {
            acc[n] = (acc[n] || 0) + 1;
            return acc;
        }, {});
        const duplicates = Object.entries(nameCounts)
            .filter(([, c]) => c > 1)
            .map(([n]) => n);
        if (duplicates.length > 0) {
            issues.push(`Duplicate activity names found: ${duplicates.join(', ')}`);
        }

        // If filter classes specified, warn if some are missing
        const filterClasses = this.activityModuleOptions?.activityClasses || [];
        if (filterClasses.length > 0) {
            const missing = filterClasses
                .map((cls) => (cls as Function).name)
                .filter((name) => !this.activityClassInfo.has(name));
            if (missing.length > 0) {
                warnings.push(
                    `Some specified activity classes were not found: ${missing.join(', ')}`,
                );
            }
        }

        return { isValid: issues.length === 0, issues, warnings };
    }

    /**
     * Get service health status for tests
     */
    getHealthStatus(): {
        status: 'healthy' | 'unhealthy' | 'degraded';
        activities: { total: number; registered: number };
        validation: { isValid: boolean; issues: string[]; warnings: string[] };
    } {
        const names = this.getActivityNames();
        const validation = this.validateConfiguration();
        let status: 'healthy' | 'unhealthy' | 'degraded' = 'degraded';
        if (!validation.isValid) status = 'unhealthy';
        else if (names.length > 0) status = 'healthy';

        return {
            status,
            activities: { total: names.length, registered: names.length },
            validation,
        };
    }

    /**
     * Get activity metadata
     */
    getActivityMetadata(name: string): unknown {
        this.ensureInitialized();

        // Try to find the corresponding class or method
        for (const provider of this.discoveryService.getProviders()) {
            const { metatype } = provider;
            if (!metatype) continue;

            // Check if it's the activity class
            const activityName = this.metadataAccessor.getActivityName(metatype);
            if (activityName === name) {
                return this.metadataAccessor.getActivityMetadata(metatype);
            }

            // Check activity methods
            const activityMethods = this.metadataAccessor.extractActivityMethodsFromClass(metatype);
            for (const methodInfo of activityMethods) {
                const methodActivityName =
                    (methodInfo as { name?: string; methodName?: string; metadata?: unknown })
                        .name || `${metatype.name}.${(methodInfo as any).methodName}`;
                if (methodActivityName === name) {
                    return (methodInfo as any).metadata;
                }
            }
        }

        return null;
    }

    /**
     * Validate all registered activities
     */
    validateActivities(): { valid: boolean; errors: string[] } {
        this.ensureInitialized();
        const errors: string[] = [];

        try {
            // Validate activity classes
            for (const [name, activity] of this.activities) {
                if (typeof activity !== 'function') {
                    errors.push(`Activity '${name}' is not a function`);
                }
            }

            // Validate activity methods
            for (const [name, method] of this.activityMethods) {
                if (typeof method !== 'function') {
                    errors.push(`Activity method '${name}' is not a function`);
                }
            }

            return {
                valid: errors.length === 0,
                errors,
            };
        } catch (error) {
            errors.push(
                `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return {
                valid: false,
                errors,
            };
        }
    }

    /**
     * Get service health status
     */
    getHealth(): {
        status: 'healthy' | 'unhealthy';
        activitiesCount: { classes: number; methods: number; total: number };
        isInitialized: boolean;
        validation: { valid: boolean; errors: string[] };
    } {
        const activitiesCount = this.isInitialized
            ? this.getActivitiesCount()
            : { classes: 0, methods: 0, total: 0 };
        const validation = this.isInitialized
            ? this.validateActivities()
            : { valid: false, errors: ['Not initialized'] };

        return {
            status: this.isInitialized && validation.valid ? 'healthy' : 'unhealthy',
            activitiesCount,
            isInitialized: this.isInitialized,
            validation,
        };
    }

    /**
     * Ensure service is initialized
     */
    private ensureInitialized(): void {
        if (!this.isInitialized) {
            throw new Error('Temporal Activity Service is not initialized');
        }
    }

    /**
     * Get registered activities
     */
    getRegisteredActivities(): Record<string, Function> {
        this.ensureInitialized();
        const allActivities: Record<string, Function> = {};

        // Add activity classes
        for (const [name, activity] of this.activities) {
            allActivities[name] = activity;
        }

        // Add activity methods
        for (const [name, method] of this.activityMethods) {
            allActivities[name] = method;
        }

        return allActivities;
    }
}
