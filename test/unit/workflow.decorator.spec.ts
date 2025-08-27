import {
    SignalMethod,
    QueryMethod,
    ChildWorkflow,
} from '../../src/decorators/workflow.decorator';
import {
    TEMPORAL_SIGNAL_METHOD,
    TEMPORAL_QUERY_METHOD,
    TEMPORAL_CHILD_WORKFLOW,
} from '../../src/constants';
import 'reflect-metadata';

describe('Workflow Decorator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('@SignalMethod', () => {
        it('should mark method with signal metadata', () => {
            class TestWorkflow {
                @SignalMethod('testSignal')
                async handleSignal(): Promise<void> {}
            }

            const proto = TestWorkflow.prototype;
            const signals = Reflect.getMetadata(TEMPORAL_SIGNAL_METHOD, proto);
            expect(signals).toBeDefined();
            expect(signals['testSignal']).toBe('handleSignal');
        });

        it('should use method name as signal name when not provided', () => {
            class TestWorkflow {
                @SignalMethod()
                async handleSignal(): Promise<void> {}
            }

            const proto = TestWorkflow.prototype;
            const signals = Reflect.getMetadata(TEMPORAL_SIGNAL_METHOD, proto);
            expect(signals).toBeDefined();
            expect(signals['handleSignal']).toBe('handleSignal');
        });

        it('should throw error for duplicate signal names', () => {
            expect(() => {
                class TestWorkflow {
                    @SignalMethod('duplicate')
                    async signal1(): Promise<void> {}

                    @SignalMethod('duplicate')
                    async signal2(): Promise<void> {}
                }
            }).toThrow('Duplicate signal name "duplicate" found');
        });

        it('should throw error for empty signal name', () => {
            expect(() => {
                class TestWorkflow {
                    @SignalMethod('')
                    async handleSignal(): Promise<void> {}
                }
            }).toThrow('Signal name cannot be empty');
        });
    });

    describe('@QueryMethod', () => {
        it('should mark method with query metadata', () => {
            class TestWorkflow {
                @QueryMethod('testQuery')
                getStatus(): string {
                    return 'active';
                }
            }

            const proto = TestWorkflow.prototype;
            const queries = Reflect.getMetadata(TEMPORAL_QUERY_METHOD, proto);
            expect(queries).toBeDefined();
            expect(queries['testQuery']).toBe('getStatus');
        });

        it('should use method name as query name when not provided', () => {
            class TestWorkflow {
                @QueryMethod()
                getStatus(): string {
                    return 'active';
                }
            }

            const proto = TestWorkflow.prototype;
            const queries = Reflect.getMetadata(TEMPORAL_QUERY_METHOD, proto);
            expect(queries).toBeDefined();
            expect(queries['getStatus']).toBe('getStatus');
        });

        it('should throw error for duplicate query names', () => {
            expect(() => {
                class TestWorkflow {
                    @QueryMethod('duplicate')
                    query1(): string { return 'test'; }

                    @QueryMethod('duplicate')
                    query2(): string { return 'test'; }
                }
            }).toThrow('Duplicate query name "duplicate" found');
        });

        it('should throw error for empty query name', () => {
            expect(() => {
                class TestWorkflow {
                    @QueryMethod('')
                    getStatus(): string {
                        return 'active';
                    }
                }
            }).toThrow('Query name cannot be empty');
        });
    });

    describe('@ChildWorkflow', () => {
        it('should mark property with child workflow metadata', () => {
            class PaymentWorkflow {}
            
            class TestWorkflow {
                @ChildWorkflow(PaymentWorkflow)
                private paymentWorkflow: PaymentWorkflow;
            }

            const instance = new TestWorkflow();
            const metadata = Reflect.getMetadata(TEMPORAL_CHILD_WORKFLOW, instance, 'paymentWorkflow');
            expect(metadata).toBeDefined();
            expect(metadata.workflowType).toBe(PaymentWorkflow);
            expect(metadata.workflowName).toBe('PaymentWorkflow');
            expect(metadata.propertyKey).toBe('paymentWorkflow');
        });

        it('should accept workflow options', () => {
            class PaymentWorkflow {}
            
            class TestWorkflow {
                @ChildWorkflow(PaymentWorkflow, { taskQueue: 'payments' })
                private paymentWorkflow: PaymentWorkflow;
            }

            const instance = new TestWorkflow();
            const metadata = Reflect.getMetadata(TEMPORAL_CHILD_WORKFLOW, instance, 'paymentWorkflow');
            expect(metadata).toBeDefined();
            expect(metadata.options).toEqual({ taskQueue: 'payments' });
        });

        it('should throw error if workflow type is not provided', () => {
            expect(() => {
                class TestWorkflow {
                    @ChildWorkflow(null as any)
                    private childWorkflow: any;
                }
            }).toThrow('Child workflow type is required');
        });

        it('should throw error if workflow type is not a class constructor', () => {
            expect(() => {
                class TestWorkflow {
                    @ChildWorkflow('not-a-class' as any)
                    private childWorkflow: any;
                }
            }).toThrow('Child workflow type must be a class constructor');
        });
    });

    describe('Integration Tests', () => {
        it('should work with multiple decorators on same class', () => {
            class PaymentWorkflow {}
            
            class TestWorkflow {
                @ChildWorkflow(PaymentWorkflow)
                private paymentWorkflow: PaymentWorkflow;

                @SignalMethod('updateStatus')
                async updateStatus(status: string): Promise<void> {}

                @QueryMethod('getStatus')
                getStatus(): string {
                    return 'active';  
                }
            }

            const instance = new TestWorkflow();
            const proto = TestWorkflow.prototype;
            
            // Check child workflow
            const childMeta = Reflect.getMetadata(TEMPORAL_CHILD_WORKFLOW, instance, 'paymentWorkflow');
            expect(childMeta).toBeDefined();
            
            // Check signal
            const signals = Reflect.getMetadata(TEMPORAL_SIGNAL_METHOD, proto);
            expect(signals['updateStatus']).toBe('updateStatus');
            
            // Check query
            const queries = Reflect.getMetadata(TEMPORAL_QUERY_METHOD, proto);
            expect(queries['getStatus']).toBe('getStatus');
        });
    });
});