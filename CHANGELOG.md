# Changelog
## [3.1.2] - 2025-11-11

### Changes

- chore: remove outdated README.md for automated release setup (5d2ac9d)
- feat: Enhance TemporalWorkerManagerService with multiple workers support (0d6fd0d)
- test: add unit tests for TemporalWorkerManagerService with multiple workers support (e474cdd)
- chore: bump version to 3.0.12 (81600c5)
- feat: add multiple workers support with different task queues (0121ba9)
- chore: release v3.0.11 - streamline README documentation (d20a0ba)
- docs: remove attribution line from README (ae2bbac)
- docs: fix and streamline README with accurate API patterns (52011b5)
- test: add comprehensive validation and configuration tests for TemporalWorkerManagerService (69b7a52)
- test: enhance error handling and coverage for Temporal services (feb9ade)
- feat(tests): enhance coverage for Temporal services (9d8dc29)
- Add unit tests for TemporalService covering initialization, workflow management, and error handling (c432119)
- Remove tests for @InjectWorkflowClient decorator in workflow.decorator.spec.ts (8e17921)
- fix: remove Node.js CI badge from README (727e21f)
- refactor: remove better-docs dependency and update health check logic (c8ba8b7)
- docs: Update README to enhance application setup instructions and improve section organization (24e9e92)
- fix: Remove Node.js 22.x from CI/CD pipeline matrix (2e00e23)
- Refactor code structure for improved readability and maintainability (d27f619)
- fix: Update coverage configuration and enhance tests for client and worker connection handling (d5e1478)
- fix: Update README badges to reflect improved test coverage metrics (fb51369)
- test: Enhance health check for worker connection and add tests for error handling (caa7bb6)
- fix: Update README badges to reflect improved test coverage metrics (e0cf0fc)
- test: Update async module test to clarify handling of null in imports array (7379e82)
- fix: Update README badges to reflect improved test coverage metrics (d4e50bc)
- test: Enhance unit tests for activity and workflow decorators with error handling and validation cases (2a50a3f)
- fix: Update README badges to reflect decreased test coverage (1651416)
- refactor: Rename interfaces for clarity and enhance validation utilities (d8ae02a)
- chore: Update test workflow to run unit tests without coverage (e01c35f)
- fix: Update README badges to reflect significant increase in test coverage (0ec59de)
- refactor: Clean up package.json scripts and remove deprecated Temporal module (e09c34a)
- fix: Update README badges to reflect improved test coverage (07e99f1)
- feat: Enhance Temporal services with improved error handling, initialization, and activity management (9f360ad)
- feat: Introduce auto-restart functionality in TemporalWorkerManagerService and enhance connection management (b026e3c)
- feat: Improve connection handling and worker configuration in TemporalWorkerManagerService (9c39d22)
- fix: Update README badges to reflect current test coverage (1198c3b)
- refactor: Remove deprecated workflow-related constants and interfaces (dab77db)
- fix: Update README badges for accuracy (4f62d81)
- fix: Update README badges for accuracy and ensure proper async handling in TemporalScheduleService methods (15ca4be)
- feat: Enhance Temporal client and worker services with improved error handling, workflow registration, and connection validation (4f30ff6)
- docs: Revise README to reflect updates in service architecture and functionality (2cdcd99)
- docs: Update branch coverage badge in README for accuracy (2565ea9)
- test: Enhance unit tests for activity decorator and temporal discovery service (5ebdd63)
- docs: Update coverage badges in README for accuracy (a666d53)
- chore: Update dependencies and improve documentation structure (2a89546)
- feat: Enhance workflow ID generation with randomness and update tests (94c6b18)
- chore: Update Jest configuration and add Istanbul badges for coverage reporting (55fa933)
- docs: Update Codecov badge link in README for accuracy (2f9e5ac)
- docs: Enhance README and update test workflow for coverage reporting (d390527)
- chore: Update testing configuration and Node.js version in workflows (41273cc)
- chore: Remove npm package lock files from .gitignore (e2c107f)
- feat: Add testing scripts and update README for improved developer experience (3703186)
- 3.0.10 (069cfd0)
- fix: Update workflow arguments in ScheduledService for daily report generation (66d3152)
- 3.0.9 (6be5b8b)
- docs: Update README with getting started recommendations and workflow implementation approaches (5d00f6e)
- 3.0.8 (6777205)
- refactor: Improve worker startup and error handling in TemporalWorkerManagerService (8fa6942)
- 3.0.7 (8f3c9c6)
- feat: Enhance NestJS Temporal Core with new features and utilities (b7728d1)
- refactor: Replace TemporalLogger instantiation with createLogger for improved logging consistency (59b7ceb)
- refactor: Enhance TemporalService and Worker Management (d81992a)
- feat: Update dependencies and implement TemporalLogger for improved logging across services (db08c73)
- 3.0.6 (b94d3f8)
- feat: Implement configurable logging across Temporal modules with ConditionalLogger utility (2ed9b8e)
- 3.0.5 (2095b82)
- refactor: Remove redundant keywords from package.json for clarity (3200693)
- feat: Add Activity and Schedules modules with comprehensive service and module options (7595d98)
- 3.0.4 (cc0962e)
- docs: Add example repository link to README for better user guidance (bfaa1e3)
- 3.0.3 (d618287)
- refactor: Simplify Temporal integration by removing workflow controller and method support, enhancing auto-discovery for activities and scheduled workflows (a08d789)
- chore: Update version to 3.0.2 and adjust import paths for consistency (e41d9c5)
- chore: Update pre-commit hook to run all checks with 'npm run check-all' (66cf653)
- chore: Update configuration files and improve code structure for better readability and maintainability (81152a2)
- refactor: Remove architecture diagram from README for clarity and conciseness (b03c4ac)
- feat(discovery): Implement TemporalDiscoveryService for auto-discovery of workflow controllers and methods (69668d8)
- chore: Replace ESLint configuration with new format and add Prettier integration; remove old .eslintrc.js file (80f6ece)
- docs: Revise getting started guide for NestJS Temporal Core (5bc3832)
- 3.0.1 (b1138d8)
- refactor: Remove outdated links and advanced topics from README (bcbdba4)
- fix: Remove test command from release scripts in package.json (5936fcb)
- feat: Add comprehensive getting started guide for NestJS Temporal integration (5c0e9a8)
- feat: Enhance Temporal service with workflow discovery and scheduling management (c72b49e)
- Update package.json (765e201)
- Update package.json (096ce6f)
- Update package.json (0b46b1c)
- Update package.json (50ee730)
- 2.0.8 (e421748)
- docs: Update README to improve code organization and clarify file purposes (d5c9077)
- 2.0.7 (bcd7c0a)
- feat: Refactor Temporal integration interfaces and modules (a452143)
- feat: remove deprecated decorators and interfaces related to Temporal scheduling (5d826b6)
- 2.0.6 (1beec39)
- feat: refactor Temporal scheduling module and service integration (76c0111)
- 2.0.5 (01b7ec1)
- feat: add update methods and related metadata for workflow updates (3d0cc8a)
- 2.0.4 (ff4dcea)
- feat: update README with enhanced feature descriptions and new advanced features (0e2f61e)
- feat: add Temporal scheduling module and service (ea44dcb)
- 2.0.3 (544db18)
- feat: Enhance Temporal integration with comprehensive metadata and configuration options (81260bb)
- 2.0.2 (18f01af)
- docs: update README with new features and configuration options (2a3754d)
- 2.0.1 (db35846)
- feat: updated code structure and fix issues with graceful shutdown (b3c494b)
- doc: updated documentation for example repo addition (07e77b0)
- 2.0.0 (87e7e68)
- chore: prepare for 1.0.0 release (88417db)
- chore: prepare for beta release (bc103ee)
- 1.0.1-beta.1 (ae00c7a)
- chore: prepare for beta release (7393357)
- 1.0.1-beta.0 (6cf61b2)
- Initial commit (9cfe52f)

## [3.1.1] - 2025-11-11

### Changes

- Delete .github/README.md (6f9cee4)

## [3.1.0] - 2025-11-11

### Changes

- feat: Enhance TemporalWorkerManagerService with multiple workers support (4d22828)
- test: add unit tests for TemporalWorkerManagerService with multiple workers support (12aee0b)


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.12] - 2025-11-07

### Added
- **Multiple Workers Support**: Configure and manage multiple workers with different task queues in the same process
- New `workers` array property in `TemporalOptions` for defining multiple worker configurations
- `getAllWorkers()`: Get information about all registered workers
- `getWorker(taskQueue)`: Get a specific worker by task queue name
- `getWorkerStatusByTaskQueue(taskQueue)`: Get status of a specific worker
- `startWorkerByTaskQueue(taskQueue)`: Start a specific worker
- `stopWorkerByTaskQueue(taskQueue)`: Stop a specific worker
- `registerWorker(workerDef)`: Dynamically register new workers at runtime
- `getWorkerManager()`: Access worker manager service
- `getConnection()`: Access native Temporal connection for custom worker creation
- New interfaces: `WorkerDefinition`, `MultipleWorkersInfo`, `CreateWorkerResult`, `WorkerInstance`
- Comprehensive migration guide in README for upgrading from single to multiple workers
- Documentation for manual worker creation using native Temporal SDK

### Changed
- Refactored `TemporalWorkerManagerService` to support both legacy single worker and new multiple workers
- Enhanced worker lifecycle management with per-worker state tracking
- Improved worker initialization with better error handling
- All interfaces consolidated in `src/interfaces.ts` (moved `WorkerInstance` from service file)

### Fixed
- No breaking changes - fully backward compatible with v3.0.11
- Legacy single worker configuration continues to work without modifications

## [3.0.11] - 2025-11-01

### Fixed
- Improved stability and error handling
- Enhanced logging for better debugging

## [3.0.10] - 2025-10-15

### Added
- Enhanced monitoring capabilities
- Improved health check endpoints

### Changed
- Updated internal architecture for better performance

## [3.0.0] - 2025-09-01

### Added
- Complete rewrite with modular architecture
- Auto-discovery of activities via decorators
- Enhanced monitoring and health checks
- Comprehensive TypeScript support
- Production-ready error handling

### Changed
- Breaking changes from v2.x - see migration guide

## [2.x] - Historical Versions

See previous releases for v2.x changelog.

---

## Migration Guide

### Upgrading from 3.0.11 to 3.0.12

No breaking changes. All existing code continues to work. See README.md for new multiple workers features.

### Upgrading from 3.0.10 to 3.0.11

No breaking changes. Minor improvements and bug fixes.

### Upgrading from 2.x to 3.x

Major rewrite - see full migration guide in documentation.
