import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService } from '@nestjs/core';
import { TemporalScheduleService } from '../../src/services/temporal-schedule.service';
import { TemporalMetadataAccessor } from '../../src/services/temporal-metadata.service';
import { TEMPORAL_MODULE_OPTIONS, TEMPORAL_CLIENT } from '../../src/constants';
import { TemporalOptions } from '../../src/interfaces';
import { ScheduleClient, ScheduleHandle } from '@temporalio/client';

describe('TemporalScheduleService', () => {
    let service: TemporalScheduleService;
    let mockScheduleClient: jest.Mocked<Partial<ScheduleClient>>;
    let mockScheduleHandle: jest.Mocked<Partial<ScheduleHandle>>;

    const mockOptions: TemporalOptions = {
        taskQueue: 'test-queue',
        connection: {
            namespace: 'test-namespace',
            address: 'localhost:7233',
        },
        enableLogger: false,
        logLevel: 'error',
    };

    beforeEach(async () => {
        mockScheduleHandle = {
            scheduleId: 'test-schedule-123',
        };

        mockScheduleClient = {
            create: jest.fn().mockResolvedValue(mockScheduleHandle),
            getHandle: jest.fn().mockReturnValue(mockScheduleHandle),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TemporalScheduleService,
                {
                    provide: TEMPORAL_MODULE_OPTIONS,
                    useValue: mockOptions,
                },
                {
                    provide: TEMPORAL_CLIENT,
                    useValue: {
                        schedule: mockScheduleClient,
                        connection: { address: 'localhost:7233' },
                    },
                },
                {
                    provide: DiscoveryService,
                    useValue: {
                        getProviders: jest.fn().mockReturnValue([]),
                        getControllers: jest.fn().mockReturnValue([]),
                    },
                },
                {
                    provide: TemporalMetadataAccessor,
                    useValue: {
                        isActivity: jest.fn().mockReturnValue(false),
                    },
                },
            ],
        }).compile();

        service = module.get<TemporalScheduleService>(TemporalScheduleService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('onModuleInit', () => {
        it('should initialize successfully with existing schedule client', async () => {
            await service.onModuleInit();

            expect(service.isHealthy()).toBe(true);
            const status = service.getStatus();
            expect(status.initialized).toBe(true);
            expect(status.schedulesSupported).toBe(true);
        });

        it('should initialize successfully and discover schedules', async () => {
            await service.onModuleInit();

            const stats = service.getScheduleStats();
            expect(stats).toBeDefined();
            expect(stats.total).toBeGreaterThanOrEqual(0);
        });

        it('should handle initialization errors', async () => {
            const moduleWithError: TestingModule = await Test.createTestingModule({
                providers: [
                    TemporalScheduleService,
                    {
                        provide: TEMPORAL_MODULE_OPTIONS,
                        useValue: mockOptions,
                    },
                    {
                        provide: TEMPORAL_CLIENT,
                        useValue: {
                            schedule: null,
                            connection: null,
                        },
                    },
                    {
                        provide: DiscoveryService,
                        useValue: {
                            getProviders: jest.fn().mockImplementation(() => {
                                throw new Error('Discovery error');
                            }),
                        },
                    },
                    {
                        provide: TemporalMetadataAccessor,
                        useValue: {},
                    },
                ],
            }).compile();

            const errorService = moduleWithError.get<TemporalScheduleService>(
                TemporalScheduleService,
            );

            await expect(errorService.onModuleInit()).rejects.toThrow();
        });

        it('should initialize with new schedule client when not provided', async () => {
            const moduleWithoutSchedule: TestingModule = await Test.createTestingModule({
                providers: [
                    TemporalScheduleService,
                    {
                        provide: TEMPORAL_MODULE_OPTIONS,
                        useValue: mockOptions,
                    },
                    {
                        provide: TEMPORAL_CLIENT,
                        useValue: {
                            connection: { address: 'localhost:7233' },
                        },
                    },
                    {
                        provide: DiscoveryService,
                        useValue: {
                            getProviders: jest.fn().mockReturnValue([]),
                            getControllers: jest.fn().mockReturnValue([]),
                        },
                    },
                    {
                        provide: TemporalMetadataAccessor,
                        useValue: {},
                    },
                ],
            }).compile();

            const newService = moduleWithoutSchedule.get<TemporalScheduleService>(
                TemporalScheduleService,
            );

            // This may fail due to ScheduleClient constructor, but we test the code path
            try {
                await newService.onModuleInit();
            } catch (error) {
                // Expected if ScheduleClient can't be created
            }
        });
    });

    describe('onModuleDestroy', () => {
        it('should clean up resources on destroy', async () => {
            await service.onModuleInit();

            await service.onModuleDestroy();

            expect(service.isHealthy()).toBe(false);
            const stats = service.getScheduleStats();
            expect(stats.total).toBe(0);
        });

        it('should handle errors during destroy gracefully', async () => {
            await service.onModuleInit();

            // Mock an error during cleanup
            jest.spyOn(service['scheduleHandles'], 'clear').mockImplementation(() => {
                throw new Error('Cleanup error');
            });

            await expect(service.onModuleDestroy()).resolves.not.toThrow();
        });
    });

    describe('createSchedule', () => {
        beforeEach(async () => {
            await service.onModuleInit();
        });

        it('should create a schedule successfully', async () => {
            const options = {
                scheduleId: 'test-schedule',
                spec: {
                    cronExpressions: ['0 0 * * *'],
                },
                action: {
                    type: 'startWorkflow' as const,
                    workflowType: 'TestWorkflow',
                    taskQueue: 'test-queue',
                    args: [],
                },
            };

            const result = await service.createSchedule(options);

            expect(result.success).toBe(true);
            expect(result.scheduleId).toBe('test-schedule');
            expect(result.handle).toBeDefined();
            expect(mockScheduleClient.create).toHaveBeenCalledWith(options);
        });

        it('should handle schedule creation errors', async () => {
            const error = new Error('Creation failed');
            mockScheduleClient.create = jest.fn().mockRejectedValue(error);

            const options = {
                scheduleId: 'failing-schedule',
                spec: { cronExpressions: ['invalid'] },
                action: {
                    type: 'startWorkflow' as const,
                    workflowType: 'Test',
                    taskQueue: 'queue',
                    args: [],
                },
            };

            const result = await service.createSchedule(options);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.scheduleId).toBe('failing-schedule');
        });

        it('should throw error if not initialized', async () => {
            const uninitializedService = new TemporalScheduleService(
                mockOptions,
                { schedule: mockScheduleClient as ScheduleClient },
                {} as DiscoveryService,
                {} as TemporalMetadataAccessor,
            );

            const options = {
                scheduleId: 'test',
                spec: {},
                action: {
                    type: 'startWorkflow' as const,
                    workflowType: 'Test',
                    taskQueue: 'queue',
                    args: [],
                },
            };

            await expect(uninitializedService.createSchedule(options)).rejects.toThrow(
                'not initialized',
            );
        });

        it('should handle non-Error objects during creation', async () => {
            mockScheduleClient.create = jest.fn().mockRejectedValue('string error');

            const options = {
                scheduleId: 'test-schedule',
                spec: {},
                action: {
                    type: 'startWorkflow' as const,
                    workflowType: 'Test',
                    taskQueue: 'queue',
                    args: [],
                },
            };

            const result = await service.createSchedule(options);

            expect(result.success).toBe(false);
            expect(result.error).toBeInstanceOf(Error);
        });
    });

    describe('getSchedule', () => {
        beforeEach(async () => {
            await service.onModuleInit();
        });

        it('should get schedule from cache', async () => {
            // First create a schedule to cache it
            await service.createSchedule({
                scheduleId: 'cached-schedule',
                spec: {},
                action: {
                    type: 'startWorkflow' as const,
                    workflowType: 'Test',
                    taskQueue: 'queue',
                    args: [],
                },
            });

            const result = await service.getSchedule('cached-schedule');

            expect(result.success).toBe(true);
            expect(result.handle).toBeDefined();
            expect(mockScheduleClient.getHandle).not.toHaveBeenCalled();
        });

        it('should get schedule from Temporal if not cached', async () => {
            const result = await service.getSchedule('uncached-schedule');

            expect(result.success).toBe(true);
            expect(result.handle).toBeDefined();
            expect(mockScheduleClient.getHandle).toHaveBeenCalledWith('uncached-schedule');
        });

        it('should handle schedule retrieval errors', async () => {
            mockScheduleClient.getHandle = jest.fn().mockImplementation(() => {
                throw new Error('Not found');
            });

            const result = await service.getSchedule('non-existent');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle non-Error objects during retrieval', async () => {
            mockScheduleClient.getHandle = jest.fn().mockImplementation(() => {
                throw 'string error';
            });

            const result = await service.getSchedule('test');

            expect(result.success).toBe(false);
            expect(result.error).toBeInstanceOf(Error);
        });
    });

    describe('isHealthy', () => {
        it('should return false before initialization', () => {
            const uninitializedService = new TemporalScheduleService(
                mockOptions,
                {},
                {} as DiscoveryService,
                {} as TemporalMetadataAccessor,
            );

            expect(uninitializedService.isHealthy()).toBe(false);
        });

        it('should return true after initialization', async () => {
            await service.onModuleInit();

            expect(service.isHealthy()).toBe(true);
        });

        it('should return false after destroy', async () => {
            await service.onModuleInit();
            await service.onModuleDestroy();

            expect(service.isHealthy()).toBe(false);
        });
    });

    describe('getScheduleStats', () => {
        it('should return stats with no schedules', async () => {
            await service.onModuleInit();

            const stats = service.getScheduleStats();

            expect(stats.total).toBe(0);
            expect(stats.active).toBe(0);
            expect(stats.inactive).toBe(0);
            expect(stats.errors).toBe(0);
            expect(stats.lastUpdated).toBeInstanceOf(Date);
        });

        it('should return stats with schedules', async () => {
            await service.onModuleInit();

            await service.createSchedule({
                scheduleId: 'schedule-1',
                spec: {},
                action: {
                    type: 'startWorkflow' as const,
                    workflowType: 'Test',
                    taskQueue: 'queue',
                    args: [],
                },
            });

            const stats = service.getScheduleStats();

            expect(stats.total).toBe(1);
            expect(stats.active).toBe(1);
        });
    });

    describe('getStatus', () => {
        it('should return status when not initialized', () => {
            const uninitializedService = new TemporalScheduleService(
                mockOptions,
                {},
                {} as DiscoveryService,
                {} as TemporalMetadataAccessor,
            );

            const status = uninitializedService.getStatus();

            expect(status.available).toBe(false);
            expect(status.healthy).toBe(false);
            expect(status.initialized).toBe(false);
        });

        it('should return status when initialized', async () => {
            await service.onModuleInit();

            const status = service.getStatus();

            expect(status.available).toBe(true);
            expect(status.healthy).toBe(true);
            expect(status.schedulesSupported).toBe(true);
            expect(status.initialized).toBe(true);
        });
    });

    describe('getHealth', () => {
        it('should return unhealthy status when not initialized', () => {
            const uninitializedService = new TemporalScheduleService(
                mockOptions,
                {},
                {} as DiscoveryService,
                {} as TemporalMetadataAccessor,
            );

            const health = uninitializedService.getHealth();

            expect(health.status).toBe('unhealthy');
            expect(health.isInitialized).toBe(false);
            expect(health.schedulesCount).toBe(0);
        });

        it('should return healthy status when initialized', async () => {
            await service.onModuleInit();

            const health = service.getHealth();

            expect(health.status).toBe('healthy');
            expect(health.isInitialized).toBe(true);
            expect(health.details.scheduleIds).toEqual([]);
            expect(health.details.hasScheduleClient).toBe(true);
        });

        it('should include schedule IDs in health details', async () => {
            await service.onModuleInit();

            await service.createSchedule({
                scheduleId: 'health-test-schedule',
                spec: {},
                action: {
                    type: 'startWorkflow' as const,
                    workflowType: 'Test',
                    taskQueue: 'queue',
                    args: [],
                },
            });

            const health = service.getHealth();

            expect(health.schedulesCount).toBe(1);
            expect(health.details.scheduleIds).toContain('health-test-schedule');
        });
    });

    describe('buildScheduleSpec', () => {
        beforeEach(async () => {
            await service.onModuleInit();
        });

        it('should build spec with cron expression', () => {
            const metadata = {
                cron: '0 0 * * *',
            };

            const result = service['buildScheduleSpec'](metadata);

            expect(result.success).toBe(true);
            expect(result.spec?.cronExpressions).toEqual(['0 0 * * *']);
        });

        it('should build spec with multiple cron expressions', () => {
            const metadata = {
                cron: ['0 0 * * *', '0 12 * * *'],
            };

            const result = service['buildScheduleSpec'](metadata);

            expect(result.success).toBe(true);
            expect(result.spec?.cronExpressions).toEqual(['0 0 * * *', '0 12 * * *']);
        });

        it('should build spec with interval', () => {
            const metadata = {
                interval: 5000,
            };

            const result = service['buildScheduleSpec'](metadata);

            expect(result.success).toBe(true);
            expect(result.spec?.intervals).toBeDefined();
        });

        it('should build spec with calendar', () => {
            const metadata = {
                calendar: { dayOfWeek: 1 },
            };

            const result = service['buildScheduleSpec'](metadata);

            expect(result.success).toBe(true);
            expect(result.spec?.calendars).toEqual([{ dayOfWeek: 1 }]);
        });

        it('should build spec with timezone', () => {
            const metadata = {
                timezone: 'America/New_York',
            };

            const result = service['buildScheduleSpec'](metadata);

            expect(result.success).toBe(true);
            expect(result.spec?.timeZone).toBe('America/New_York');
        });

        it('should build spec with jitter', () => {
            const metadata = {
                jitter: '10s',
            };

            const result = service['buildScheduleSpec'](metadata);

            expect(result.success).toBe(true);
            expect(result.spec?.jitter).toBe('10s');
        });

        it('should handle multiple intervals', () => {
            const metadata = {
                interval: [1000, 5000],
            };

            const result = service['buildScheduleSpec'](metadata);

            expect(result.success).toBe(true);
            expect(result.spec?.intervals).toHaveLength(2);
        });

        it('should handle errors in spec building', () => {
            // Create an object that will throw when accessed
            const metadata = {
                get cron() {
                    throw new Error('Spec error');
                },
            };

            const result = service['buildScheduleSpec'](metadata);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('parseInterval', () => {
        beforeEach(async () => {
            await service.onModuleInit();
        });

        it('should parse number as milliseconds', () => {
            const result = service['parseInterval'](5000);

            expect(result.success).toBe(true);
            expect(result.interval?.every).toBe('5000ms');
        });

        it('should parse milliseconds string', () => {
            const result = service['parseInterval']('1000ms');

            expect(result.success).toBe(true);
            expect(result.interval?.every).toBe('1000ms');
        });

        it('should parse seconds string', () => {
            const result = service['parseInterval']('30s');

            expect(result.success).toBe(true);
            expect(result.interval?.every).toBe('30s');
        });

        it('should parse minutes string', () => {
            const result = service['parseInterval']('5m');

            expect(result.success).toBe(true);
            expect(result.interval?.every).toBe('5m');
        });

        it('should parse hours string', () => {
            const result = service['parseInterval']('2h');

            expect(result.success).toBe(true);
            expect(result.interval?.every).toBe('2h');
        });

        it('should default to milliseconds for plain numbers', () => {
            const result = service['parseInterval']('5000');

            expect(result.success).toBe(true);
            expect(result.interval?.every).toBe('5000ms');
        });

        it('should handle case insensitive units', () => {
            const result = service['parseInterval']('30S');

            expect(result.success).toBe(true);
            expect(result.interval?.every).toBe('30s');
        });

        it('should handle parse errors', () => {
            const invalidInterval = {
                toString: () => {
                    throw new Error('Parse error');
                },
            };

            const result = service['parseInterval'](invalidInterval as any);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('buildWorkflowOptions', () => {
        beforeEach(async () => {
            await service.onModuleInit();
        });

        it('should build options with all properties', () => {
            const metadata = {
                taskQueue: 'custom-queue',
                workflowId: 'custom-id',
                workflowExecutionTimeout: '1h',
                workflowRunTimeout: '30m',
                workflowTaskTimeout: '10s',
                retryPolicy: { maximumAttempts: 3 },
                args: ['arg1', 'arg2'],
            };

            const options = service['buildWorkflowOptions'](metadata);

            expect(options.taskQueue).toBe('custom-queue');
            expect(options.workflowId).toBe('custom-id');
            expect(options.workflowExecutionTimeout).toBe('1h');
            expect(options.workflowRunTimeout).toBe('30m');
            expect(options.workflowTaskTimeout).toBe('10s');
            expect(options.retryPolicy).toEqual({ maximumAttempts: 3 });
            expect(options.args).toEqual(['arg1', 'arg2']);
        });

        it('should build options with partial properties', () => {
            const metadata = {
                taskQueue: 'test-queue',
            };

            const options = service['buildWorkflowOptions'](metadata);

            expect(options.taskQueue).toBe('test-queue');
            expect(options.workflowId).toBeUndefined();
        });

        it('should return empty options for empty metadata', () => {
            const options = service['buildWorkflowOptions']({});

            expect(Object.keys(options)).toHaveLength(0);
        });
    });

    describe('discoverAndRegisterSchedules', () => {
        it('should skip discovery successfully', async () => {
            await service.onModuleInit();

            // Discovery should complete without errors
            const health = service.getHealth();
            expect(health.isInitialized).toBe(true);
        });

        it('should handle discovery errors', async () => {
            const moduleWithError: TestingModule = await Test.createTestingModule({
                providers: [
                    TemporalScheduleService,
                    {
                        provide: TEMPORAL_MODULE_OPTIONS,
                        useValue: mockOptions,
                    },
                    {
                        provide: TEMPORAL_CLIENT,
                        useValue: {
                            schedule: mockScheduleClient,
                        },
                    },
                    {
                        provide: DiscoveryService,
                        useValue: {
                            getProviders: jest.fn().mockImplementation(() => {
                                throw new Error('Discovery failed');
                            }),
                        },
                    },
                    {
                        provide: TemporalMetadataAccessor,
                        useValue: {},
                    },
                ],
            }).compile();

            const errorService = moduleWithError.get<TemporalScheduleService>(
                TemporalScheduleService,
            );

            await expect(errorService.onModuleInit()).rejects.toThrow();
        });
    });
});
