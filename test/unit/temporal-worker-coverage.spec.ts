import { Test, TestingModule } from '@nestjs/testing';
import { TemporalWorkerManagerService } from '../../src/services/temporal-worker.service';
import { TemporalDiscoveryService } from '../../src/services/temporal-discovery.service';
import { TEMPORAL_MODULE_OPTIONS, TEMPORAL_CONNECTION } from '../../src/constants';
import { TemporalOptions } from '../../src/interfaces';

describe('TemporalWorkerManagerService - Branch Coverage', () => {
    let service: TemporalWorkerManagerService;
    let mockDiscoveryService: any;
    let mockConnection: any;

    beforeEach(async () => {
        mockDiscoveryService = {
            discoverActivities: jest.fn().mockResolvedValue({
                success: true,
                discoveredCount: 0,
                activities: [],
                errors: [],
            }),
        };

        mockConnection = {
            close: jest.fn().mockResolvedValue(undefined),
        };

        const moduleOptions: TemporalOptions = {
            connection: {
                address: 'localhost:7233',
            },
            taskQueue: 'test-queue',
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TemporalWorkerManagerService,
                {
                    provide: TemporalDiscoveryService,
                    useValue: mockDiscoveryService,
                },
                {
                    provide: TEMPORAL_MODULE_OPTIONS,
                    useValue: moduleOptions,
                },
                {
                    provide: TEMPORAL_CONNECTION,
                    useValue: null,
                },
            ],
        }).compile();

        service = module.get<TemporalWorkerManagerService>(TemporalWorkerManagerService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('runWorkerWithAutoRestart auto-restart logic', () => {
        it('should trigger auto-restart when within restart limits', async () => {
            const mockWorker = {
                run: jest.fn().mockRejectedValue(new Error('Worker crashed')),
            };

            (service as any).worker = mockWorker;
            (service as any).restartCount = 1;
            (service as any).maxRestarts = 3;
            (service as any).options = { ...(service as any).options, autoRestart: true };

            jest.spyOn(service as any, 'autoRestartWorker').mockResolvedValue(undefined);

            const loggerInfoSpy = jest.spyOn((service as any).logger, 'info').mockImplementation();
            const loggerErrorSpy = jest
                .spyOn((service as any).logger, 'error')
                .mockImplementation();

            await (service as any).runWorkerWithAutoRestart();

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 1500));

            expect((service as any).restartCount).toBe(2);
            expect(loggerInfoSpy).toHaveBeenCalledWith(
                expect.stringContaining('Auto-restart enabled'),
            );
            expect(loggerErrorSpy).toHaveBeenCalledWith('Worker run failed', expect.any(Error));

            loggerInfoSpy.mockRestore();
            loggerErrorSpy.mockRestore();
        });

        it('should log max restarts exceeded when limit reached', async () => {
            const mockWorker = {
                run: jest.fn().mockRejectedValue(new Error('Worker crashed')),
            };

            (service as any).worker = mockWorker;
            (service as any).restartCount = 3;
            (service as any).maxRestarts = 3;

            const loggerErrorSpy = jest
                .spyOn((service as any).logger, 'error')
                .mockImplementation();

            await (service as any).runWorkerWithAutoRestart();

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 600));

            expect(loggerErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Max restart attempts (3) exceeded'),
            );

            loggerErrorSpy.mockRestore();
        });

        it('should not auto-restart when autoRestart is false', async () => {
            const mockWorker = {
                run: jest.fn().mockRejectedValue(new Error('Worker crashed')),
            };

            (service as any).worker = mockWorker;
            (service as any).restartCount = 0;
            (service as any).options = { ...(service as any).options, autoRestart: false };

            const loggerInfoSpy = jest.spyOn((service as any).logger, 'info').mockImplementation();

            await (service as any).runWorkerWithAutoRestart();

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 600));

            expect(loggerInfoSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('Auto-restart enabled'),
            );

            loggerInfoSpy.mockRestore();
        });

        it('should handle autoRestartWorker failure', async () => {
            const mockWorker = {
                run: jest.fn().mockRejectedValue(new Error('Worker crashed')),
            };

            (service as any).worker = mockWorker;
            (service as any).restartCount = 0;
            (service as any).maxRestarts = 3;
            (service as any).options = { ...(service as any).options, autoRestart: true };

            jest.spyOn(service as any, 'autoRestartWorker').mockRejectedValue(
                new Error('Restart failed'),
            );

            const loggerErrorSpy = jest
                .spyOn((service as any).logger, 'error')
                .mockImplementation();

            await (service as any).runWorkerWithAutoRestart();

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 1500));

            expect(loggerErrorSpy).toHaveBeenCalledWith('Auto-restart failed', expect.any(Error));

            loggerErrorSpy.mockRestore();
        });
    });

    describe('extractErrorMessage', () => {
        it('should extract message from Error instance', () => {
            const error = new Error('Test error');
            const result = (service as any).extractErrorMessage(error);
            expect(result).toBe('Test error');
        });

        it('should handle string error', () => {
            const result = (service as any).extractErrorMessage('String error');
            expect(result).toBe('String error');
        });

        it('should handle null error', () => {
            const result = (service as any).extractErrorMessage(null);
            expect(result).toBe('Unknown error');
        });

        it('should handle undefined error', () => {
            const result = (service as any).extractErrorMessage(undefined);
            expect(result).toBe('Unknown error');
        });

        it('should handle numeric error', () => {
            const result = (service as any).extractErrorMessage(42);
            expect(result).toBe('Unknown error');
        });

        it('should handle object error without message', () => {
            const result = (service as any).extractErrorMessage({ code: 'TEST' });
            expect(result).toBe('Unknown error');
        });
    });

    describe('getWorkflowSource', () => {
        it('should return "bundle" when workflowBundle is configured', () => {
            (service as any).options = {
                ...(service as any).options,
                worker: { workflowBundle: { bundlePath: '/path' } },
            };
            expect((service as any).getWorkflowSource()).toBe('bundle');
        });

        it('should return "filesystem" when workflowsPath is configured', () => {
            (service as any).options = {
                ...(service as any).options,
                worker: { workflowsPath: '/path' },
            };
            expect((service as any).getWorkflowSource()).toBe('filesystem');
        });

        it('should return "none" when no workflow config', () => {
            (service as any).options = {
                ...(service as any).options,
                worker: {},
            };
            expect((service as any).getWorkflowSource()).toBe('none');
        });

        it('should return "none" when worker is undefined', () => {
            (service as any).options = {
                ...(service as any).options,
                worker: undefined,
            };
            expect((service as any).getWorkflowSource()).toBe('none');
        });
    });

    describe('shutdown error handling', () => {
        it('should not close injected connection', async () => {
            const injectedConnection = {
                close: jest.fn().mockResolvedValue(undefined),
            };

            (service as any).worker = null;
            (service as any).connection = mockConnection;
            (service as any).injectedConnection = injectedConnection;

            await (service as any).performShutdown();

            expect(injectedConnection.close).not.toHaveBeenCalled();
            expect(mockConnection.close).not.toHaveBeenCalled();
        });

        it('should handle connection close error gracefully', async () => {
            (service as any).worker = null;
            (service as any).connection = {
                close: jest.fn().mockRejectedValue(new Error('Close failed')),
            };
            (service as any).injectedConnection = null;

            const loggerWarnSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation();

            await (service as any).performShutdown();

            expect(loggerWarnSpy).toHaveBeenCalledWith(
                'Error closing connection',
                expect.any(Error),
            );

            loggerWarnSpy.mockRestore();
        });
    });

    describe('initializeWorker allowConnectionFailure handling', () => {
        it('should return error when allowConnectionFailure is false', async () => {
            const testService = new TemporalWorkerManagerService(
                mockDiscoveryService,
                {
                    connection: { address: 'localhost:7233' },
                    taskQueue: 'test-queue',
                    worker: { workflowsPath: '/test' },
                    allowConnectionFailure: false,
                },
                null,
            );

            jest.spyOn(testService as any, 'createConnection').mockRejectedValue(
                new Error('Connection failed'),
            );

            const loggerErrorSpy = jest
                .spyOn((testService as any).logger, 'error')
                .mockImplementation();

            const result = await (testService as any).initializeWorker();

            expect(result.success).toBe(false);
            expect(result.error).toBeInstanceOf(Error);

            loggerErrorSpy.mockRestore();
        });
    });

    describe('runWorkerWithAutoRestart return early', () => {
        it('should return early if worker is null', async () => {
            (service as any).worker = null;

            const result = await (service as any).runWorkerWithAutoRestart();

            expect(result).toBeUndefined();
        });
    });
});
