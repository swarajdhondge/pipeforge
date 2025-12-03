/**
 * Backward Compatibility Test Script
 * 
 * This script validates that all existing functionality from Phase 2 continues to work
 * after implementing Phase 3 security features.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { Pool } from 'pg';
import { config } from '../config/env';
import { PipeService } from '../services/pipe.service';
import { ExecutionService } from '../services/execution.service';
import { UserService } from '../services/user.service';
import logger from '../utils/logger';

const pool = new Pool({
  connectionString: config.databaseUrl,
});

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  try {
    await testFn();
    results.push({ name, passed: true });
    logger.info(`✅ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    logger.error(`❌ ${name}: ${error.message}`);
  }
}

async function main() {
  logger.info('Starting backward compatibility tests...\n');

  const pipeService = new PipeService(pool);
  const executionService = new ExecutionService(pool);
  const userService = new UserService(pool);

  // Create test user
  let testUserId: string;
  let testPipeId: string;

  await runTest('Create test user', async () => {
    const email = `test-compat-${Date.now()}@example.com`;
    const authResponse = await userService.register(email, 'password123');
    testUserId = authResponse.user.id;
    if (!testUserId) throw new Error('Failed to create test user');
  });

  // Test 1: Create pipe without secrets (Requirement 1.1, 8.3)
  await runTest('Create pipe without secrets', async () => {
    const pipe = await pipeService.create({
      user_id: testUserId,
      name: 'Test Pipe - No Secrets',
      description: 'Testing backward compatibility',
      definition: {
        nodes: [
          {
            id: 'fetch-1',
            type: 'fetch',
            position: { x: 100, y: 100 },
            data: {
              label: 'Fetch Data',
              config: {
                url: 'https://jsonplaceholder.typicode.com/users/1'
              }
            }
          }
        ],
        edges: []
      },
      is_public: true // Make public for anonymous execution test
    });
    testPipeId = pipe.id;
    if (!pipe.id) throw new Error('Failed to create pipe');
  });

  // Test 2: Execute pipe without secrets (Requirement 1.2, 8.4)
  await runTest('Execute pipe without secrets', async () => {
    const execution = await executionService.executeSyncWithTimeout({
      pipe_id: testPipeId,
      user_id: testUserId,
      mode: 'sync'
    });
    if (execution.status !== 'completed') {
      throw new Error(`Execution failed: ${execution.status}`);
    }
    if (!execution.result) {
      throw new Error('Execution result is empty');
    }
  });

  // Test 3: Fetch operator without secrets works unchanged (Requirement 1.2, 3.3)
  await runTest('Fetch operator without secrets', async () => {
    const pipe = await pipeService.create({
      user_id: testUserId,
      name: 'Test Fetch - No Auth',
      description: 'Testing Fetch operator without authentication',
      definition: {
        nodes: [
          {
            id: 'fetch-1',
            type: 'fetch',
            position: { x: 100, y: 100 },
            data: {
              label: 'Fetch Users',
              config: {
                url: 'https://jsonplaceholder.typicode.com/users'
              }
            }
          }
        ],
        edges: []
      },
      is_public: false
    });

    const execution = await executionService.executeSyncWithTimeout({
      pipe_id: pipe.id,
      user_id: testUserId,
      mode: 'sync'
    });

    if (execution.status !== 'completed') {
      throw new Error(`Fetch execution failed: ${execution.status}`);
    }

    const result = execution.result as any;
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Fetch did not return expected data');
    }
  });

  // Test 4: Filter operator works unchanged (Requirement 8.2)
  await runTest('Filter operator unchanged', async () => {
    const pipe = await pipeService.create({
      user_id: testUserId,
      name: 'Test Filter',
      description: 'Testing Filter operator',
      definition: {
        nodes: [
          {
            id: 'fetch-1',
            type: 'fetch',
            position: { x: 100, y: 100 },
            data: {
              label: 'Fetch Users',
              config: {
                url: 'https://jsonplaceholder.typicode.com/users'
              }
            }
          },
          {
            id: 'filter-1',
            type: 'filter',
            position: { x: 300, y: 100 },
            data: {
              label: 'Filter Users',
              config: {
                rules: [
                  { field: 'id', operator: 'lt', value: '5' }
                ]
              }
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'fetch-1', target: 'filter-1' }
        ]
      },
      is_public: false
    });

    const execution = await executionService.executeSyncWithTimeout({
      pipe_id: pipe.id,
      user_id: testUserId,
      mode: 'sync'
    });

    if (execution.status !== 'completed') {
      throw new Error(`Filter execution failed: ${execution.status}`);
    }

    const result = execution.result as any;
    if (!Array.isArray(result) || result.length !== 4) {
      throw new Error(`Filter did not return expected data (expected 4, got ${result?.length})`);
    }
  });

  // Test 5: Sort operator works unchanged (Requirement 8.2)
  await runTest('Sort operator unchanged', async () => {
    const pipe = await pipeService.create({
      user_id: testUserId,
      name: 'Test Sort',
      description: 'Testing Sort operator',
      definition: {
        nodes: [
          {
            id: 'fetch-1',
            type: 'fetch',
            position: { x: 100, y: 100 },
            data: {
              label: 'Fetch Users',
              config: {
                url: 'https://jsonplaceholder.typicode.com/users'
              }
            }
          },
          {
            id: 'sort-1',
            type: 'sort',
            position: { x: 300, y: 100 },
            data: {
              label: 'Sort by Name',
              config: {
                field: 'name',
                direction: 'asc'
              }
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'fetch-1', target: 'sort-1' }
        ]
      },
      is_public: false
    });

    const execution = await executionService.executeSyncWithTimeout({
      pipe_id: pipe.id,
      user_id: testUserId,
      mode: 'sync'
    });

    if (execution.status !== 'completed') {
      throw new Error(`Sort execution failed: ${execution.status}`);
    }

    const result = execution.result as any;
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Sort did not return expected data');
    }

    // Verify sorting
    for (let i = 1; i < result.length; i++) {
      if (result[i].name < result[i - 1].name) {
        throw new Error('Sort order is incorrect');
      }
    }
  });

  // Test 6: Transform operator works unchanged (Requirement 8.2)
  await runTest('Transform operator unchanged', async () => {
    const pipe = await pipeService.create({
      user_id: testUserId,
      name: 'Test Transform',
      description: 'Testing Transform operator',
      definition: {
        nodes: [
          {
            id: 'fetch-1',
            type: 'fetch',
            position: { x: 100, y: 100 },
            data: {
              label: 'Fetch User',
              config: {
                url: 'https://jsonplaceholder.typicode.com/users/1'
              }
            }
          },
          {
            id: 'transform-1',
            type: 'transform',
            position: { x: 300, y: 100 },
            data: {
              label: 'Transform User',
              config: {
                mappings: [
                  { source: 'name', target: 'fullName' },
                  { source: 'email', target: 'emailAddress' }
                ]
              }
            }
          }
        ],
        edges: [
          { id: 'e1', source: 'fetch-1', target: 'transform-1' }
        ]
      },
      is_public: false
    });

    const execution = await executionService.executeSyncWithTimeout({
      pipe_id: pipe.id,
      user_id: testUserId,
      mode: 'sync'
    });

    if (execution.status !== 'completed') {
      throw new Error(`Transform execution failed: ${execution.status}`);
    }

    const result = execution.result as any;
    if (!result.fullName || !result.emailAddress) {
      throw new Error('Transform did not map fields correctly');
    }
  });

  // Test 7: Anonymous execution still works (Requirement 1.4, 8.5)
  await runTest('Anonymous execution works', async () => {
    const execution = await executionService.executeSyncWithTimeout({
      pipe_id: testPipeId,
      user_id: null, // Anonymous
      mode: 'sync'
    });

    if (execution.status !== 'completed') {
      throw new Error(`Anonymous execution failed: ${execution.status}`);
    }
  });

  // Test 8: Pipe CRUD operations unchanged (Requirement 8.1)
  await runTest('Pipe CRUD operations unchanged', async () => {
    // Create
    const pipe = await pipeService.create({
      user_id: testUserId,
      name: 'Test CRUD',
      description: 'Testing CRUD operations',
      definition: {
        nodes: [],
        edges: []
      },
      is_public: false
    });

    // Read
    const retrieved = await pipeService.get(pipe.id, testUserId);
    if (!retrieved || retrieved.name !== 'Test CRUD') {
      throw new Error('Pipe retrieval failed');
    }

    // Update
    const updated = await pipeService.update(pipe.id, testUserId, {
      name: 'Test CRUD Updated',
      description: 'Updated description',
      definition: {
        nodes: [],
        edges: []
      },
      is_public: false
    });
    if (updated.name !== 'Test CRUD Updated') {
      throw new Error('Pipe update failed');
    }

    // Delete
    await pipeService.delete(pipe.id, testUserId);
    
    // Verify deletion - should return null
    const deletedPipe = await pipeService.get(pipe.id, testUserId);
    if (deletedPipe !== null) {
      throw new Error('Pipe should have been deleted');
    }
  });

  // Test 9: Pipe versioning unchanged (Requirement 8.1)
  await runTest('Pipe versioning unchanged', async () => {
    const pipe = await pipeService.create({
      user_id: testUserId,
      name: 'Test Versioning',
      description: 'Testing version history',
      definition: {
        nodes: [],
        edges: []
      },
      is_public: false
    });

    // Update to create version
    await pipeService.update(pipe.id, testUserId, {
      name: 'Test Versioning v2',
      description: 'Updated',
      definition: {
        nodes: [],
        edges: []
      },
      is_public: false
    });

    // Get versions
    const versions = await pipeService.getVersions(pipe.id, testUserId);
    if (versions.length < 2) {
      throw new Error('Version history not working');
    }
  });

  // Test 10: Pipe forking unchanged (Requirement 8.1)
  await runTest('Pipe forking unchanged', async () => {
    const originalPipe = await pipeService.create({
      user_id: testUserId,
      name: 'Original Pipe',
      description: 'To be forked',
      definition: {
        nodes: [
          {
            id: 'fetch-1',
            type: 'fetch',
            position: { x: 100, y: 100 },
            data: {
              label: 'Fetch Data',
              config: {
                url: 'https://jsonplaceholder.typicode.com/users/1'
              }
            }
          }
        ],
        edges: []
      },
      is_public: true
    });

    const forkedPipe = await pipeService.fork(originalPipe.id, testUserId);
    // Check for both "(fork)" and "(Fork)" to be flexible
    if (!forkedPipe.name.toLowerCase().includes('(fork)')) {
      throw new Error('Forked pipe name not updated');
    }
    if (forkedPipe.definition.nodes.length !== 1) {
      throw new Error('Forked pipe definition not copied');
    }
  });

  // Note: Test data cleanup would require manual database cleanup
  // or a dedicated cleanup script

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('BACKWARD COMPATIBILITY TEST RESULTS');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED - Backward compatibility verified!');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED - Backward compatibility issues detected!');
    process.exit(1);
  }
}

main()
  .catch((error) => {
    logger.error('Test script failed', { error: error.message });
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });

