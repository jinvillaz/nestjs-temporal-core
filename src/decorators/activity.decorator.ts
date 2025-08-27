import { Type } from '@nestjs/common';
import { TEMPORAL_ACTIVITY, TEMPORAL_ACTIVITY_METHOD } from '../constants';
import { ActivityMethodOptions, ActivityOptions } from '../interfaces';
import { createLogger } from '../utils/logger';

const logger = createLogger('ActivityDecorators');

/**
 * Activity decorator for marking classes as Temporal activities
 *
 * @param options Activity configuration options
 *
 * @example
 * ```typescript
 * @Activity({ name: 'email-activities' })
 * export class EmailActivities {
 *   @ActivityMethod('sendEmail')
 *   async sendEmail(to: string, subject: string, body: string): Promise<void> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export const Activity = (options?: ActivityOptions): ClassDecorator => {
    return (target: unknown) => {
        const targetClass = target as Function;
        const activityName = options?.name || targetClass.name;

        logger.debug(`@Activity decorator applied to class: ${targetClass.name}`);
        logger.debug(`Activity name: ${activityName}`);
        logger.debug(`Activity options: ${JSON.stringify(options)}`);

        const metadata = {
            name: activityName,
            className: targetClass.name,
            ...options,
        };

        logger.debug(
            `Storing activity metadata for ${targetClass.name}: ${JSON.stringify(metadata)}`,
        );

        try {
            // Standardized metadata storage - only use Reflect.defineMetadata
            Reflect.defineMetadata(TEMPORAL_ACTIVITY, metadata, targetClass);
            logger.debug(`Stored activity metadata on class constructor: ${targetClass.name}`);

            // Store on prototype for discovery service compatibility
            Reflect.defineMetadata(TEMPORAL_ACTIVITY, metadata, targetClass.prototype);
            logger.debug(`Stored activity metadata on class prototype: ${targetClass.name}`);

            logger.debug(`@Activity decorator successfully applied to ${targetClass.name}`);
        } catch (error) {
            logger.error(`Failed to apply @Activity decorator to ${targetClass.name}:`, error);
            throw error;
        }

        return target as never;
    };
};

/**
 * Activity method decorator for marking methods as Temporal activity methods
 *
 * @param nameOrOptions Activity name or configuration options
 *
 * @example
 * ```typescript
 * // Using method name as activity name
 * @ActivityMethod()
 * async processOrder(orderId: string): Promise<void> {
 *   // Implementation
 * }
 *
 * // Using custom activity name
 * @ActivityMethod('process-order')
 * async processOrder(orderId: string): Promise<void> {
 *   // Implementation
 * }
 *
 * // Using options object
 * @ActivityMethod({
 *   name: 'process-order',
 *   timeout: '5m',
 *   maxRetries: 3
 * })
 * async processOrder(orderId: string): Promise<void> {
 *   // Implementation
 * }
 * ```
 */
export const ActivityMethod = (nameOrOptions?: string | ActivityMethodOptions): MethodDecorator => {
    return (
        target: object,
        propertyKey: string | symbol,
        descriptor?: PropertyDescriptor,
    ): PropertyDescriptor | void => {
        const className = target.constructor.name;
        const methodName = propertyKey.toString();

        logger.debug(`@ActivityMethod decorator applied to method: ${className}.${methodName}`);
        logger.debug(`ActivityMethod nameOrOptions: ${JSON.stringify(nameOrOptions)}`);

        let activityName: string;
        let methodOptions: ActivityMethodOptions = {};

        // Parse name and options
        if (typeof nameOrOptions === 'string') {
            activityName = nameOrOptions;
            methodOptions = { name: activityName };
            logger.debug(`Using provided string name: ${activityName}`);
        } else if (
            nameOrOptions &&
            typeof nameOrOptions.name === 'string' &&
            nameOrOptions.name.trim().length > 0
        ) {
            activityName = nameOrOptions.name;
            methodOptions = { ...nameOrOptions };
            logger.debug(`Using name from options object: ${activityName}`);
        } else if (nameOrOptions && nameOrOptions.name === '') {
            // Handle explicit empty name - should throw error
            activityName = '';
            methodOptions = { ...nameOrOptions };
            logger.debug(`Explicit empty name provided`);
        } else if (nameOrOptions && !nameOrOptions.name) {
            // Handle options object without name property
            activityName = methodName;
            methodOptions = { name: activityName, ...nameOrOptions };
            logger.debug(`Using method name as activity name: ${activityName}`);
        } else {
            activityName = methodName;
            methodOptions = { name: activityName };
            logger.debug(`Auto-generated activity name from method name: ${activityName}`);
        }

        // Validate activity name
        if (!activityName || activityName.trim().length === 0) {
            const error = 'Activity name cannot be empty';
            logger.error(
                `@ActivityMethod validation failed for ${className}.${methodName}: ${error}`,
            );
            throw new Error(error);
        }

        logger.verbose(
            `Activity name resolved to: "${activityName}" for method ${className}.${methodName}`,
        );

        const metadata = {
            name: activityName,
            methodName,
            className,
            ...methodOptions,
        };

        logger.debug(
            `Final activity metadata for ${className}.${methodName}: ${JSON.stringify(metadata)}`,
        );

        try {
            if (descriptor?.value && typeof descriptor.value === 'function') {
                logger.debug(
                    `Storing @ActivityMethod metadata on method function: ${className}.${methodName}`,
                );

                // Standardized metadata storage - only use Reflect.defineMetadata
                Reflect.defineMetadata(TEMPORAL_ACTIVITY_METHOD, metadata, descriptor.value);
                logger.debug(
                    `Stored activity method metadata on method function: ${className}.${methodName}`,
                );

                // Store on class prototype for discovery
                const activityMethods =
                    Reflect.getMetadata(TEMPORAL_ACTIVITY_METHOD, target.constructor.prototype) ||
                    {};
                activityMethods[methodName] = metadata;
                Reflect.defineMetadata(
                    TEMPORAL_ACTIVITY_METHOD,
                    activityMethods,
                    target.constructor.prototype,
                );
                logger.debug(`Stored activity method metadata on class prototype: ${className}`);
                logger.debug(
                    `Total activity methods on ${className}: ${Object.keys(activityMethods).length}`,
                );

                logger.debug(
                    `@ActivityMethod decorator successfully applied to ${className}.${methodName}`,
                );
                return descriptor;
            } else {
                logger.debug(`Handling property-style decorator for ${className}.${methodName}`);
                // Handle property-style decorators (fallback)
                Reflect.defineMetadata(TEMPORAL_ACTIVITY_METHOD, metadata, target, propertyKey);
                logger.debug(
                    `Stored activity method metadata on property: ${className}.${methodName}`,
                );
            }
        } catch (error) {
            logger.error(
                `Failed to apply @ActivityMethod decorator to ${className}.${methodName}:`,
                error,
            );
            throw error;
        }
    };
};

/**
 * Property decorator to inject a Temporal activity proxy into a workflow class.
 *
 * This decorator allows you to call activities from within a workflow by injecting
 * a type-safe proxy for the specified activity class. The proxy will use the provided
 * options (timeouts, retry policies, etc.) or sensible defaults if not specified.
 *
 * @param activityType The activity class to inject as a proxy
 * @param options Optional proxy options (timeouts, retry policies, etc.)
 *
 * @example
 * ```typescript
 * import { InjectActivity } from '@nestjs-temporal/core';
 * import { EmailActivities } from './email.activities';
 *
 * @Workflow()
 * export class UserWorkflow {
 *   @InjectActivity(EmailActivities, { startToCloseTimeout: '2m' })
 *   private readonly email!: EmailActivities;
 *
 *   @WorkflowRun()
 *   async execute(userId: string) {
 *     await this.email.sendWelcomeEmail(userId);
 *   }
 * }
 * ```
 *
 * @remarks
 * - The injected property will be a proxy that calls the actual activity implementation.
 * - At least one timeout (startToCloseTimeout or scheduleToCloseTimeout) must be provided; a default is used if omitted.
 * - This decorator is only valid inside workflow classes.
 *
 * @see {@link Activity} for marking activity classes
 * @see {@link ActivityMethod} for marking activity methods
 */
export function InjectActivity<T>(
    activityType: Type<T>,
    options?: Record<string, unknown>,
): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol) => {
        const className = target.constructor.name;
        const propertyName = propertyKey.toString();

        logger.debug(`@InjectActivity decorator applied to property: ${className}.${propertyName}`);
        logger.debug(`Activity type: ${activityType?.name}`);
        logger.debug(`Activity injection options: ${JSON.stringify(options)}`);

        if (!activityType) {
            const error = 'Activity type is required';
            logger.error(
                `@InjectActivity validation failed for ${className}.${propertyName}: ${error}`,
            );
            throw new Error(error);
        }

        // Validate that activityType is actually a class constructor
        if (typeof activityType !== 'function') {
            const error = 'Activity type must be a class constructor';
            logger.error(
                `@InjectActivity validation failed for ${className}.${propertyName}: ${error}`,
            );
            throw new Error(error);
        }

        // Store metadata for dependency injection and discovery
        const metadata = {
            activityType,
            activityName: activityType.name,
            propertyKey: propertyName,
            className,
            options: options || {},
        };

        logger.debug(
            `Storing @InjectActivity metadata for ${className}.${propertyName}: ${JSON.stringify(metadata)}`,
        );

        try {
            Reflect.defineMetadata('INJECT_ACTIVITY', metadata, target, propertyKey);
            logger.debug(`Stored @InjectActivity metadata for ${className}.${propertyName}`);

            // Try to use proxyActivities if available in workflow context
            try {
                const globalProxyActivities = (globalThis as { proxyActivities?: unknown })
                    .proxyActivities;
                let importedProxyActivities: unknown;

                try {
                    // Try to import proxyActivities from @temporalio/workflow
                    importedProxyActivities = require('@temporalio/workflow').proxyActivities;
                } catch {
                    // Import failed, continue with global check
                }

                const proxyActivitiesFunc = (globalProxyActivities ||
                    importedProxyActivities) as any;

                if (proxyActivitiesFunc) {
                    // Set default options if none provided or if empty object
                    const activityOptions =
                        options && Object.keys(options).length > 0
                            ? options
                            : { startToCloseTimeout: '1m' };
                    const proxy = proxyActivitiesFunc(activityOptions);

                    Object.defineProperty(target, propertyKey, {
                        value: proxy,
                        writable: false,
                        enumerable: false,
                        configurable: false,
                    });
                } else {
                    // proxyActivities not available, create a getter that will be replaced by the DI system
                    Object.defineProperty(target, propertyKey, {
                        get() {
                            const error =
                                `Activity ${activityType.name} not injected for ${className}.${propertyName}. ` +
                                `This should be set up by the workflow execution context.`;
                            logger.warn(
                                `Activity not injected: ${className}.${propertyName} -> ${activityType.name}`,
                            );
                            throw new Error(error);
                        },
                        enumerable: false,
                        configurable: true, // Allow DI system to replace this
                    });
                }
            } catch {
                // If proxyActivities setup fails, throw error
                throw new Error('proxyActivities is not available');
            }
            logger.debug(
                `Created property descriptor for activity injection: ${className}.${propertyName}`,
            );

            logger.debug(
                `@InjectActivity decorator successfully applied to ${className}.${propertyName}`,
            );
        } catch (error) {
            logger.error(
                `Failed to apply @InjectActivity decorator to ${className}.${propertyName}:`,
                error,
            );
            throw error;
        }
    };
}

// Re-export InjectWorkflowClient from workflow decorator for compatibility
export { InjectWorkflowClient } from './workflow.decorator';
