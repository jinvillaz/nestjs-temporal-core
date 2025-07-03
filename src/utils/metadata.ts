/**
 * @fileoverview Metadata utility functions for NestJS Temporal Core
 *
 * This module provides utility functions for working with metadata stored by
 * decorators. These functions help the framework understand how to process
 * activities, workflows, and parameter injection at runtime.
 *
 * @author NestJS Temporal Core
 * @version 1.0.0
 */

import {
    TEMPORAL_ACTIVITY,
    TEMPORAL_ACTIVITY_METHOD,
    WORKFLOW_PARAMS_METADATA,
} from '../constants';
import { ActivityMethodOptions, ActivityOptions, WorkflowParameterMetadata } from '../interfaces';

// ==========================================
// Activity Metadata Utilities
// ==========================================

/**
 * Checks if a class is marked as a Temporal Activity.
 *
 * @param target - The class to check
 * @returns True if the class has activity metadata
 *
 * @example
 * ```typescript
 * @Activity()
 * class MyActivity {}
 *
 * console.log(isActivity(MyActivity)); // true
 * ```
 */
export function isActivity(target: object): boolean {
    return Reflect.hasMetadata(TEMPORAL_ACTIVITY, target);
}

/**
 * Retrieves activity metadata from a class.
 *
 * @param target - The class to get metadata from
 * @returns Activity options or undefined if not found
 *
 * @example
 * ```typescript
 * @Activity({ taskQueue: 'my-queue' })
 * class MyActivity {}
 *
 * const metadata = getActivityMetadata(MyActivity);
 * console.log(metadata.taskQueue); // 'my-queue'
 * ```
 */
export function getActivityMetadata(target: object): ActivityOptions | undefined {
    return Reflect.getMetadata(TEMPORAL_ACTIVITY, target);
}

/**
 * Checks if a method is marked as a Temporal Activity method.
 *
 * @param target - The method to check
 * @returns True if the method has activity method metadata
 */
export function isActivityMethod(target: object): boolean {
    return Reflect.hasMetadata(TEMPORAL_ACTIVITY_METHOD, target);
}

/**
 * Retrieves activity method metadata from a method.
 *
 * @param target - The method to get metadata from
 * @returns Activity method options or undefined if not found
 */
export function getActivityMethodMetadata(target: object): ActivityMethodOptions | undefined {
    return Reflect.getMetadata(TEMPORAL_ACTIVITY_METHOD, target);
}

// ==========================================
// Parameter Metadata Utilities
// ==========================================

/**
 * Utility function to get parameter metadata for a method
 * Used internally by the framework to understand how to inject parameters
 */
export function getParameterMetadata(
    target: object,
    propertyKey: string | symbol,
): WorkflowParameterMetadata[] {
    return Reflect.getMetadata(WORKFLOW_PARAMS_METADATA, target, propertyKey) || [];
}

/**
 * Internal decorator implementation for metadata storage
 */
export function WorkflowParamDecorator(index?: number): ParameterDecorator {
    return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
        if (!propertyKey) return;

        const existingParams: WorkflowParameterMetadata[] =
            Reflect.getMetadata(WORKFLOW_PARAMS_METADATA, target, propertyKey) || [];
        existingParams[parameterIndex] = {
            type: 'param',
            index: index !== undefined ? index : parameterIndex,
            extractAll: index === undefined,
        };
        Reflect.defineMetadata(WORKFLOW_PARAMS_METADATA, existingParams, target, propertyKey);
    };
}
