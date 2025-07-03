# NestJS Temporal Core

A comprehensive NestJS integration for [Temporal.io](https://temporal.io/) that provides seamless workflow orchestration with auto-discovery, declarative scheduling, and production-ready features.

[![npm version](https://badge.fury.io/js/nestjs-temporal-core.svg)](https://badge.fury.io/js/nestjs-temporal-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## Overview

NestJS Temporal Core brings Temporal's durable execution to NestJS with familiar decorator patterns and automatic discovery. Build reliable distributed systems with activities and scheduled tasks using native NestJS conventions.

## 💡 Example Repository

🔗 **[Complete Example Project](https://github.com/harsh-simform/nestjs-temporal-core-example)** - Check out our full working example repository to see NestJS Temporal Core in action with real-world use cases, configuration examples, and best practices.

## 🚀 Key Features

- **🎯 NestJS-Native** - Familiar patterns: `@Activity`, `@Cron`, `@Interval`, `@Scheduled`
- **🔍 Auto-Discovery** - Automatically finds and registers activities and schedules
- **📅 Declarative Scheduling** - Built-in cron and interval scheduling with validation
- **🔄 Unified Service** - Single `TemporalService` for all operations
- **⚙️ Flexible Setup** - Client-only, worker-only, or unified deployments
- **🏥 Health Monitoring** - Comprehensive status monitoring and health checks
- **🔧 Production Ready** - TLS, connection management, graceful shutdowns
- **📊 Modular Architecture** - Individual modules for specific needs
- **📝 Configurable Logging** - Fine-grained control with `TemporalLogger`
- **🔐 Enterprise Ready** - Temporal Cloud support with TLS and API keys
- **🛠️ Developer Experience** - Rich TypeScript support with comprehensive utilities
- **⚡ Performance Optimized** - Efficient metadata handling and caching

## 📦 Installation

```bash
npm install nestjs-temporal-core @temporalio/client @temporalio/worker @temporalio/workflow
```

## 🏗️ Architecture

NestJS Temporal Core is built with a modular architecture:

```text
nestjs-temporal-core/
├── src/
│   ├── decorators/          # Activity, workflow, and scheduling decorators
│   ├── client/              # Temporal client management
│   ├── worker/              # Worker lifecycle and management
│   ├── activity/            # Activity discovery and execution
│   ├── schedules/           # Schedule management
│   ├── discovery/           # Auto-discovery services
│   ├── utils/               # Utilities (validation, metadata, logging)
│   ├── constants.ts         # Predefined constants and expressions
│   ├── interfaces.ts        # TypeScript interfaces and types
│   ├── temporal.module.ts   # Main module
│   └── temporal.service.ts  # Unified service
```

## 🚀 Quick Start

### 1. Complete Integration (Recommended)

For applications that need full Temporal functionality:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TemporalModule } from 'nestjs-temporal-core';
import { EmailActivities } from './activities/email.activities';

@Module({
  imports: [
    TemporalModule.register({
      connection: {
        address: 'localhost:7233',
        namespace: 'default',
      },
      taskQueue: 'main-queue',
      worker: {
        workflowsPath: './dist/workflows',
        activityClasses: [EmailActivities],
        autoStart: true
      }
    })
  ],
  providers: [EmailActivities], // Auto-discovered
})
export class AppModule {}
```

### 2. Define Activities

```typescript
// activities/email.activities.ts
import { Injectable } from '@nestjs/common';
import { Activity, ActivityMethod } from 'nestjs-temporal-core';

@Activity()
@Injectable()
export class EmailActivities {
  
  @ActivityMethod({
    name: 'sendEmail',
    timeout: '30s',
    maxRetries: 3
  })
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log(`Sending email to ${to}: ${subject}`);
    // Your email sending logic here
  }

  @ActivityMethod('sendNotification')
  async sendNotification(userId: string, message: string): Promise<void> {
    console.log(`Notifying user ${userId}: ${message}`);
    // Your notification logic here
  }
}
```

### 3. Create Workflows

```typescript
// workflows/email.workflow.ts
import { proxyActivities } from '@temporalio/workflow';
import type { EmailActivities } from '../activities/email.activities';

const { sendEmail, sendNotification } = proxyActivities<EmailActivities>({
  startToCloseTimeout: '1 minute',
});

export async function processEmailWorkflow(
  userId: string,
  emailData: { to: string; subject: string; body: string }
): Promise<void> {
  // Send email
  await sendEmail(emailData.to, emailData.subject, emailData.body);
  
  // Send notification
  await sendNotification(userId, 'Email sent successfully');
}
```

### 4. Schedule Workflows

```typescript
// services/scheduled.service.ts
import { Injectable } from '@nestjs/common';
import { 
  Scheduled, 
  Cron, 
  Interval, 
  CRON_EXPRESSIONS,
  INTERVAL_EXPRESSIONS 
} from 'nestjs-temporal-core';

@Injectable()
export class ScheduledService {
  
  @Scheduled({
    scheduleId: 'daily-report',
    cron: CRON_EXPRESSIONS.DAILY_8AM,
    description: 'Generate daily sales report',
    taskQueue: 'reports'
  })
  async generateDailyReport(): Promise<void> {
    console.log('Generating daily report...');
    // Your report generation logic
  }

  @Cron(CRON_EXPRESSIONS.WEEKLY_MONDAY_9AM, {
    scheduleId: 'weekly-cleanup',
    description: 'Weekly system cleanup'
  })
  async performWeeklyCleanup(): Promise<void> {
    console.log('Performing weekly cleanup...');
    // Your cleanup logic
  }

  @Interval(INTERVAL_EXPRESSIONS.EVERY_5_MINUTES, {
    scheduleId: 'health-check',
    description: 'System health monitoring'
  })
  async performHealthCheck(): Promise<void> {
    console.log('Performing health check...');
    // Your health check logic
  }
}
```

### 5. Parameter Injection in Workflows

```typescript
// workflows/order.workflow.ts
import { Injectable } from '@nestjs/common';
import { 
  WorkflowParam, 
  WorkflowContext, 
  WorkflowId, 
  RunId,
  TaskQueue 
} from 'nestjs-temporal-core';

@Injectable()
export class OrderWorkflowController {
  
  async processOrder(
    @WorkflowParam(0) orderId: string,
    @WorkflowParam(1) customerData: any,
    @WorkflowId() workflowId: string,
    @WorkflowContext() context: any
  ): Promise<void> {
    console.log(`Processing order ${orderId} in workflow ${workflowId}`);
    // Your workflow logic
  }

  @Signal('updateOrder')
  async updateOrder(@WorkflowParam() updateData: any): Promise<void> {
    // Handle order update signal
  }

  @Query('getOrderStatus')
  getOrderStatus(@RunId() runId: string): string {
    // Return current order status
    return 'processing';
  }
}
```

### 6. Use in Services

```typescript
// services/order.service.ts
import { Injectable } from '@nestjs/common';
import { TemporalService } from 'nestjs-temporal-core';

@Injectable()
export class OrderService {
  constructor(private readonly temporal: TemporalService) {}

  async createOrder(orderData: any) {
    const { workflowId } = await this.temporal.startWorkflow(
      'processOrder',
      [orderData],
      {
        taskQueue: 'orders',
        workflowId: `order-${orderData.id}`,
        searchAttributes: {
          'customer-id': orderData.customerId
        }
      }
    );

    return { workflowId };
  }

  async cancelOrder(orderId: string) {
    await this.temporal.signalWorkflow(`order-${orderId}`, 'cancel');
    return { cancelled: true };
  }

  async getOrderStatus(orderId: string) {
    const status = await this.temporal.queryWorkflow(`order-${orderId}`, 'getStatus');
    return status;
  }
}
```

## 🛠️ Utilities and Constants

NestJS Temporal Core provides comprehensive utilities and predefined constants for common use cases:

### Predefined Constants

```typescript
import { 
  CRON_EXPRESSIONS, 
  INTERVAL_EXPRESSIONS, 
  TIMEOUTS,
  RETRY_POLICIES 
} from 'nestjs-temporal-core';

// Cron expressions
console.log(CRON_EXPRESSIONS.DAILY_8AM);        // '0 8 * * *'
console.log(CRON_EXPRESSIONS.WEEKLY_MONDAY_9AM); // '0 9 * * 1'
console.log(CRON_EXPRESSIONS.MONTHLY_FIRST);     // '0 0 1 * *'

// Interval expressions
console.log(INTERVAL_EXPRESSIONS.EVERY_5_MINUTES); // '5m'
console.log(INTERVAL_EXPRESSIONS.EVERY_HOUR);      // '1h'
console.log(INTERVAL_EXPRESSIONS.DAILY);           // '24h'

// Timeout values
console.log(TIMEOUTS.ACTIVITY_SHORT);    // '1m'
console.log(TIMEOUTS.WORKFLOW_MEDIUM);   // '24h'
console.log(TIMEOUTS.CONNECTION_TIMEOUT); // '10s'

// Retry policies
console.log(RETRY_POLICIES.QUICK.maximumAttempts); // 3
console.log(RETRY_POLICIES.STANDARD.backoffCoefficient); // 2.0
```

### Validation Utilities

```typescript
import { 
  isValidCronExpression, 
  isValidIntervalExpression 
} from 'nestjs-temporal-core';

// Validate cron expressions
console.log(isValidCronExpression('0 8 * * *')); // true
console.log(isValidCronExpression('invalid'));   // false

// Validate interval expressions
console.log(isValidIntervalExpression('5m'));    // true
console.log(isValidIntervalExpression('2h'));    // true
console.log(isValidIntervalExpression('bad'));   // false
```

### Metadata Utilities

```typescript
import { 
  isActivity,
  getActivityMetadata,
  isActivityMethod,
  getActivityMethodMetadata,
  getParameterMetadata 
} from 'nestjs-temporal-core';

// Check if a class is marked as an Activity
@Activity({ taskQueue: 'my-queue' })
class MyActivity {}

console.log(isActivity(MyActivity)); // true
const metadata = getActivityMetadata(MyActivity);
console.log(metadata.taskQueue); // 'my-queue'

// Check method metadata
const methodMetadata = getActivityMethodMetadata(MyActivity.prototype.myMethod);
```

### Logging Configuration

```typescript
import { TemporalLogger, TemporalLoggerManager } from 'nestjs-temporal-core';

// Configure logging
const logger = TemporalLoggerManager.getInstance();
logger.configure({
  enableLogger: true,
  logLevel: 'info',
  appName: 'My Temporal App'
});

// Use in your services
@Injectable()
export class MyService {
  private readonly logger = new TemporalLogger(MyService.name);

  async doSomething() {
    this.logger.info('Starting operation');
    this.logger.error('Something went wrong', { context: 'additional data' });
  }
}
```

## 🏗️ Integration Patterns

### Client-Only Integration

For applications that only start workflows (e.g., web APIs):

```typescript
import { TemporalClientModule } from 'nestjs-temporal-core';

@Module({
  imports: [
    TemporalClientModule.forRoot({
      connection: {
        address: 'localhost:7233',
        namespace: 'production'
      }
    })
  ],
  providers: [ApiService],
})
export class ClientOnlyModule {}
```

### Worker-Only Integration

For dedicated worker processes:

```typescript
import { TemporalWorkerModule, WORKER_PRESETS } from 'nestjs-temporal-core';

@Module({
  imports: [
    TemporalWorkerModule.forRoot({
      connection: {
        address: 'localhost:7233',
        namespace: 'production'
      },
      taskQueue: 'worker-queue',
      workflowsPath: './dist/workflows',
      activityClasses: [ProcessingActivities],
      workerOptions: WORKER_PRESETS.PRODUCTION_HIGH_THROUGHPUT
    })
  ],
  providers: [ProcessingActivities],
})
export class WorkerOnlyModule {}
```

### Modular Integration

Using individual modules for specific needs:

```typescript
import { 
  TemporalClientModule,
  TemporalActivityModule,
  TemporalSchedulesModule 
} from 'nestjs-temporal-core';

@Module({
  imports: [
    // Client for workflow operations
    TemporalClientModule.forRoot({
      connection: { address: 'localhost:7233' }
    }),
    
    // Activities management
    TemporalActivityModule.forRoot({
      activityClasses: [EmailActivities, PaymentActivities]
    }),
    
    // Schedule management
    TemporalSchedulesModule.forRoot({
      autoStart: true,
      defaultTimezone: 'UTC'
    }),
  ],
  providers: [EmailActivities, PaymentActivities, ScheduledService],
})
export class ModularIntegrationModule {}
```

## ⚙️ Configuration

### Async Configuration

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TemporalModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        connection: {
          address: config.get('TEMPORAL_ADDRESS'),
          namespace: config.get('TEMPORAL_NAMESPACE'),
          tls: config.get('TEMPORAL_TLS_ENABLED') === 'true',
          apiKey: config.get('TEMPORAL_API_KEY'),
        },
        taskQueue: config.get('TEMPORAL_TASK_QUEUE'),
        worker: {
          workflowsPath: config.get('WORKFLOWS_PATH'),
          activityClasses: [EmailActivities, PaymentActivities],
          autoStart: config.get('WORKER_AUTO_START') !== 'false',
        }
      }),
      inject: [ConfigService],
    })
  ],
})
export class AppModule {}
```

### Environment-Specific Configurations

```typescript
// Development
const developmentConfig = {
  connection: {
    address: 'localhost:7233',
    namespace: 'development'
  },
  taskQueue: 'dev-queue',
  worker: {
    workflowsPath: './dist/workflows',
    workerOptions: WORKER_PRESETS.DEVELOPMENT
  }
};

// Production
const productionConfig = {
  connection: {
    address: process.env.TEMPORAL_ADDRESS!,
    namespace: process.env.TEMPORAL_NAMESPACE!,
    tls: true,
    apiKey: process.env.TEMPORAL_API_KEY
  },
  taskQueue: process.env.TEMPORAL_TASK_QUEUE!,
  worker: {
    workflowBundle: require('../workflows/bundle'), // Pre-bundled
    workerOptions: WORKER_PRESETS.PRODUCTION_BALANCED
  }
};
```

## 📝 Logger Configuration

Control logging behavior across all Temporal modules with configurable logger settings:

### Basic Logger Setup

```typescript
// Enable/disable logging and set log levels
TemporalModule.register({
  connection: {
    address: 'localhost:7233',
    namespace: 'default'
  },
  taskQueue: 'main-queue',
  // Logger configuration
  enableLogger: true,        // Enable/disable all logging
  logLevel: 'info',         // Set log level: 'error' | 'warn' | 'info' | 'debug' | 'verbose'
  worker: {
    workflowsPath: './dist/workflows',
    activityClasses: [EmailActivities]
  }
})
```

### Environment-Based Logger Configuration

```typescript
// Different log levels for different environments
const loggerConfig = {
  development: {
    enableLogger: true,
    logLevel: 'debug' as const  // Show all logs in development
  },
  production: {
    enableLogger: true,
    logLevel: 'warn' as const   // Only warnings and errors in production
  },
  testing: {
    enableLogger: false         // Disable logging during tests
  }
};

TemporalModule.register({
  connection: { address: 'localhost:7233' },
  taskQueue: 'main-queue',
  ...loggerConfig[process.env.NODE_ENV || 'development'],
  worker: {
    workflowsPath: './dist/workflows'
  }
})
```

### Individual Module Logger Configuration

Configure logging for specific modules:

```typescript
// Activity Module with custom logging
TemporalActivityModule.forRoot({
  activityClasses: [EmailActivities],
  enableLogger: true,
  logLevel: 'debug'
})

// Schedules Module with minimal logging
TemporalSchedulesModule.forRoot({
  autoStart: true,
  enableLogger: true,
  logLevel: 'error'  // Only show errors
})

// Client Module with no logging
TemporalClientModule.forRoot({
  connection: { address: 'localhost:7233' },
  enableLogger: false
})
```

### Log Level Hierarchy

The logger follows a hierarchical structure where each level includes all levels above it:

- **`error`**: Only critical errors
- **`warn`**: Errors + warnings
- **`info`**: Errors + warnings + informational messages (default)
- **`debug`**: Errors + warnings + info + debug information
- **`verbose`**: All messages including verbose details

### Async Configuration with Logger

```typescript
TemporalModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    connection: {
      address: config.get('TEMPORAL_ADDRESS'),
      namespace: config.get('TEMPORAL_NAMESPACE')
    },
    taskQueue: config.get('TEMPORAL_TASK_QUEUE'),
    // Dynamic logger configuration
    enableLogger: config.get('TEMPORAL_LOGGING_ENABLED', 'true') === 'true',
    logLevel: config.get('TEMPORAL_LOG_LEVEL', 'info'),
    worker: {
      workflowsPath: './dist/workflows'
    }
  }),
  inject: [ConfigService]
})
```

### Logger Examples

```typescript
// Silent mode - no logs
{
  enableLogger: false
}

// Error only - for production monitoring
{
  enableLogger: true,
  logLevel: 'error'
}

// Development mode - detailed logging
{
  enableLogger: true,
  logLevel: 'debug'
}

// Verbose mode - maximum detail for troubleshooting
{
  enableLogger: true,
  logLevel: 'verbose'
}
```

## 📊 Health Monitoring

Built-in health monitoring for production environments:

```typescript
@Controller('health')
export class HealthController {
  constructor(private readonly temporal: TemporalService) {}

  @Get('temporal')
  async getTemporalHealth() {
    const health = await this.temporal.getOverallHealth();
    return {
      status: health.status,
      components: health.components,
      timestamp: new Date().toISOString()
    };
  }

  @Get('temporal/detailed')
  async getDetailedStatus() {
    const systemStatus = await this.temporal.getSystemStatus();
    const stats = this.temporal.getDiscoveryStats();
    
    return {
      system: systemStatus,
      discovery: stats,
      schedules: this.temporal.getScheduleStats()
    };
  }
}
```

## 🔧 Advanced Features

### Activity Options

```typescript
@Activity()
@Injectable()
export class PaymentActivities {
  
  @ActivityMethod({
    name: 'processPayment',
    timeout: '2m',
    maxRetries: 5,
    retryPolicy: {
      maximumAttempts: 5,
      initialInterval: '1s',
      maximumInterval: '60s',
      backoffCoefficient: 2.0
    }
  })
  async processPayment(orderId: string, amount: number) {
    // Complex payment processing with retries
  }
}
```

### Schedule Management

```typescript
@Injectable()
export class ScheduleManagementService {
  constructor(private readonly temporal: TemporalService) {}

  async pauseSchedule(scheduleId: string) {
    await this.temporal.pauseSchedule(scheduleId, 'Maintenance mode');
  }

  async resumeSchedule(scheduleId: string) {
    await this.temporal.resumeSchedule(scheduleId);
  }

  async triggerScheduleNow(scheduleId: string) {
    await this.temporal.triggerSchedule(scheduleId);
  }

  async getScheduleInfo(scheduleId: string) {
    return this.temporal.getScheduleInfo(scheduleId);
  }
}
```

### Workflow Signals and Queries

```typescript
// In your workflow
import { defineSignal, defineQuery, setHandler } from '@temporalio/workflow';

export const cancelSignal = defineSignal('cancel');
export const getStatusQuery = defineQuery<string>('getStatus');

export async function orderWorkflow(orderData: any) {
  let status = 'processing';
  let cancelled = false;

  // Handle cancel signal
  setHandler(cancelSignal, () => {
    cancelled = true;
    status = 'cancelled';
  });

  // Handle status query
  setHandler(getStatusQuery, () => status);

  // Workflow logic with cancellation support
  if (cancelled) return;
  
  // Process order...
  status = 'completed';
}
```

## 🌐 Temporal Cloud Integration

For Temporal Cloud deployments:

```typescript
TemporalModule.register({
  connection: {
    address: 'your-namespace.account.tmprl.cloud:7233',
    namespace: 'your-namespace.account',
    tls: true,
    apiKey: process.env.TEMPORAL_API_KEY,
    metadata: {
      'temporal-namespace': 'your-namespace.account'
    }
  },
  taskQueue: 'production-queue',
  worker: {
    workflowBundle: require('../workflows/bundle'),
    workerOptions: WORKER_PRESETS.PRODUCTION_BALANCED
  }
})
```

## 📋 Best Practices

### 1. **Activity Design**
- Keep activities idempotent
- Use proper timeouts and retry policies
- Handle errors gracefully
- Use dependency injection for testability

### 2. **Workflow Organization**
- Separate workflow files from activities
- Use TypeScript for type safety
- Keep workflows deterministic
- Bundle workflows for production

### 3. **Configuration Management**
- Use environment variables for connection settings
- Separate configs for different environments
- Use async configuration for dynamic settings
- Validate configuration at startup

### 4. **Monitoring & Observability**
- Implement health checks
- Monitor worker status
- Track schedule execution
- Use structured logging

### 5. **Production Deployment**
- Use pre-bundled workflows
- Configure appropriate worker limits
- Enable TLS for security
- Implement graceful shutdowns

## 📚 API Reference

### Core Decorators

#### Activity Decorators
- `@Activity(options?)` - Mark a class as containing Temporal activities
- `@ActivityMethod(nameOrOptions?)` - Define an activity method with optional configuration

#### Scheduling Decorators
- `@Scheduled(options)` - Schedule a workflow with comprehensive options
- `@Cron(expression, options?)` - Schedule using cron expression
- `@Interval(interval, options?)` - Schedule using interval expression

#### Workflow Decorators
- `@Signal(nameOrOptions?)` - Mark a method as a signal handler
- `@Query(nameOrOptions?)` - Mark a method as a query handler

#### Parameter Injection Decorators
- `@WorkflowParam(index?)` - Extract workflow parameters
- `@WorkflowContext()` - Inject workflow execution context
- `@WorkflowId()` - Inject workflow ID
- `@RunId()` - Inject run ID
- `@TaskQueue()` - Inject task queue name

### Core Services

- `TemporalService` - Main unified service for all Temporal operations
- `TemporalClientService` - Client-only operations (starting workflows, signals, queries)
- `TemporalActivityService` - Activity discovery and management
- `TemporalSchedulesService` - Schedule creation and management
- `TemporalWorkerManagerService` - Worker lifecycle and health monitoring

### Utility Functions

#### Validation
- `isValidCronExpression(cron: string): boolean` - Validate cron format
- `isValidIntervalExpression(interval: string): boolean` - Validate interval format

#### Metadata
- `isActivity(target: object): boolean` - Check if class is an activity
- `getActivityMetadata(target: object)` - Get activity metadata
- `isActivityMethod(target: object): boolean` - Check if method is activity method
- `getActivityMethodMetadata(target: object)` - Get activity method metadata
- `getParameterMetadata(target: object, propertyKey: string | symbol)` - Get parameter metadata

#### Logging
- `TemporalLogger` - Enhanced logger with context support
- `TemporalLoggerManager` - Global logger configuration

### Predefined Constants

#### Schedule Expressions
- `CRON_EXPRESSIONS` - Common cron patterns (DAILY_8AM, WEEKLY_MONDAY_9AM, etc.)
- `INTERVAL_EXPRESSIONS` - Common interval patterns (EVERY_5_MINUTES, EVERY_HOUR, etc.)

#### Configuration Presets
- `TIMEOUTS` - Common timeout values for different operation types
- `RETRY_POLICIES` - Predefined retry policies (QUICK, STANDARD, AGGRESSIVE)

#### Module Tokens
- `TEMPORAL_MODULE_OPTIONS` - Main module configuration token
- `TEMPORAL_CLIENT` - Client instance injection token
- `TEMPORAL_CONNECTION` - Connection instance injection token

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Temporal.io](https://temporal.io/) for the amazing workflow engine
- [NestJS](https://nestjs.com/) for the fantastic framework
- The TypeScript community for excellent tooling

---

Built with ❤️ for the NestJS and Temporal communities
