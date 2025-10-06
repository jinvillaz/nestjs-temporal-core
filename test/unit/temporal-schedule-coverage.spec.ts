import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService } from '@nestjs/core';
import { TemporalScheduleService } from '../../src/services/temporal-schedule.service';
import { TemporalMetadataAccessor } from '../../src/services/temporal-metadata.service';
import { TEMPORAL_CLIENT, TEMPORAL_MODULE_OPTIONS } from '../../src/constants';
import { TemporalOptions } from '../../src/interfaces';

describe('TemporalScheduleService - Coverage Improvements', () => {
    let service: TemporalScheduleService;
    let mockClient: any;
    let mockDiscoveryService: any;
    let mockMetadataAccessor: any;

    beforeEach(async () => {
        mockClient = {
            workflow: {
                getHandle: jest.fn(),
            },
            connection: {
                close: jest.fn(),
            },
        };

        mockDiscoveryService = {
            getProviders: jest.fn().mockReturnValue([]),
            getControllers: jest.fn().mockReturnValue([]),
        };

        mockMetadataAccessor = {
            isActivity: jest.fn().mockReturnValue(false),
            getActivityMetadata: jest.fn(),
            extractActivityMethods: jest.fn().mockReturnValue([]),
        };

        const moduleOptions: TemporalOptions = {
            connection: {
                address: 'localhost:7233',
            },
            taskQueue: 'test-queue',
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TemporalScheduleService,
                {
                    provide: TEMPORAL_CLIENT,
                    useValue: mockClient,
                },
                {
                    provide: TEMPORAL_MODULE_OPTIONS,
                    useValue: moduleOptions,
                },
                {
                    provide: DiscoveryService,
                    useValue: mockDiscoveryService,
                },
                {
                    provide: TemporalMetadataAccessor,
                    useValue: mockMetadataAccessor,
                },
            ],
        }).compile();

        service = module.get<TemporalScheduleService>(TemporalScheduleService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('discoverAndRegisterSchedules error path (lines 156-158)', () => {
        it('should handle discoverAndRegisterSchedules error - Error instance', async () => {
            // Spy on the debug logger to make it throw
            jest.spyOn((service as any).temporalLogger, 'debug').mockImplementation(() => {
                throw new Error('Discovery failed');
            });

            const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation();

            const result = await (service as any).discoverAndRegisterSchedules();

            expect(result.success).toBe(false);
            expect(result.discoveredCount).toBe(0);
            expect(result.errors).toEqual([{ schedule: 'discovery', error: 'Discovery failed' }]);
            expect(result.duration).toBeGreaterThanOrEqual(0);
            expect(loggerSpy).toHaveBeenCalledWith(
                'Failed to discover schedules: Discovery failed',
            );

            loggerSpy.mockRestore();
        });

        it('should handle discoverAndRegisterSchedules error - non-Error', async () => {
            // Spy on the debug logger to make it throw a non-Error
            jest.spyOn((service as any).temporalLogger, 'debug').mockImplementation(() => {
                throw 'String error';
            });

            const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation();

            const result = await (service as any).discoverAndRegisterSchedules();

            expect(result.success).toBe(false);
            expect(result.discoveredCount).toBe(0);
            expect(result.errors).toEqual([{ schedule: 'discovery', error: 'Unknown error' }]);
            expect(result.duration).toBeGreaterThanOrEqual(0);
            expect(loggerSpy).toHaveBeenCalledWith('Failed to discover schedules: Unknown error');

            loggerSpy.mockRestore();
        });

        it('should handle discoverAndRegisterSchedules error - null', async () => {
            jest.spyOn((service as any).temporalLogger, 'debug').mockImplementation(() => {
                throw null;
            });

            const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation();

            const result = await (service as any).discoverAndRegisterSchedules();

            expect(result.success).toBe(false);
            expect(result.discoveredCount).toBe(0);
            expect(result.errors).toEqual([{ schedule: 'discovery', error: 'Unknown error' }]);
            expect(loggerSpy).toHaveBeenCalledWith('Failed to discover schedules: Unknown error');

            loggerSpy.mockRestore();
        });

        it('should handle discoverAndRegisterSchedules error - undefined', async () => {
            jest.spyOn((service as any).temporalLogger, 'debug').mockImplementation(() => {
                throw undefined;
            });

            const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation();

            const result = await (service as any).discoverAndRegisterSchedules();

            expect(result.success).toBe(false);
            expect(result.discoveredCount).toBe(0);
            expect(result.errors).toEqual([{ schedule: 'discovery', error: 'Unknown error' }]);
            expect(loggerSpy).toHaveBeenCalledWith('Failed to discover schedules: Unknown error');

            loggerSpy.mockRestore();
        });

        it('should handle discoverAndRegisterSchedules error - object', async () => {
            jest.spyOn((service as any).temporalLogger, 'debug').mockImplementation(() => {
                throw { code: 'ERR_DISCOVERY' };
            });

            const loggerSpy = jest.spyOn((service as any).logger, 'error').mockImplementation();

            const result = await (service as any).discoverAndRegisterSchedules();

            expect(result.success).toBe(false);
            expect(result.discoveredCount).toBe(0);
            expect(result.errors).toEqual([{ schedule: 'discovery', error: 'Unknown error' }]);
            expect(loggerSpy).toHaveBeenCalledWith('Failed to discover schedules: Unknown error');

            loggerSpy.mockRestore();
        });
    });
});
