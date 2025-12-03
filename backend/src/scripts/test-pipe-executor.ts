import { PipeExecutor } from '../services/pipe-executor';
import { OperatorRegistry } from '../operators/operator-registry';
import { FetchOperator } from '../operators/fetch-operator';
import { FilterOperator } from '../operators/filter-operator';
import { SortOperator } from '../operators/sort-operator';
import { TransformOperator } from '../operators/transform-operator';
import { PipeDefinition } from '../types/operator.types';

async function testPipeExecutor() {
  console.log('Testing Pipe Executor...\n');

  // Set up registry with all operators
  const registry = new OperatorRegistry();
  registry.register(new FetchOperator());
  registry.register(new FilterOperator());
  registry.register(new SortOperator());
  registry.register(new TransformOperator());

  const executor = new PipeExecutor(registry);

  // Test 1: Simple pipe with Fetch
  console.log('Test 1: Simple pipe with Fetch');
  const simplePipe: PipeDefinition = {
    nodes: [
      {
        id: 'fetch1',
        type: 'fetch',
        position: { x: 0, y: 0 },
        data: {
          label: 'Fetch Data',
          config: { url: 'https://jsonplaceholder.typicode.com/posts/1' },
        },
      },
    ],
    edges: [],
  };

  try {
    const result = await executor.execute(simplePipe);
    console.log('✓ Simple pipe executed');
    console.log(`  Result has userId: ${result.userId !== undefined}`);
  } catch (error: any) {
    console.log(`✗ Failed: ${error.message}`);
  }

  // Test 2: Pipe with Fetch → Filter
  console.log('\nTest 2: Pipe with Fetch → Filter');
  const fetchFilterPipe: PipeDefinition = {
    nodes: [
      {
        id: 'fetch1',
        type: 'fetch',
        position: { x: 0, y: 0 },
        data: {
          label: 'Fetch Posts',
          config: { url: 'https://jsonplaceholder.typicode.com/posts' },
        },
      },
      {
        id: 'filter1',
        type: 'filter',
        position: { x: 0, y: 100 },
        data: {
          label: 'Filter by userId',
          config: {
            rules: [{ field: 'userId', operator: 'equals', value: 1 }],
          },
        },
      },
    ],
    edges: [{ id: 'e1', source: 'fetch1', target: 'filter1' }],
  };

  try {
    const result = await executor.execute(fetchFilterPipe);
    console.log('✓ Fetch → Filter pipe executed');
    console.log(`  Filtered ${result.length} posts`);
    console.log(`  All have userId=1: ${result.every((p: any) => p.userId === 1)}`);
  } catch (error: any) {
    console.log(`✗ Failed: ${error.message}`);
  }

  // Test 3: Pipe with Fetch → Filter → Sort
  console.log('\nTest 3: Pipe with Fetch → Filter → Sort');
  const fetchFilterSortPipe: PipeDefinition = {
    nodes: [
      {
        id: 'fetch1',
        type: 'fetch',
        position: { x: 0, y: 0 },
        data: {
          label: 'Fetch Posts',
          config: { url: 'https://jsonplaceholder.typicode.com/posts' },
        },
      },
      {
        id: 'filter1',
        type: 'filter',
        position: { x: 0, y: 100 },
        data: {
          label: 'Filter by userId',
          config: {
            rules: [{ field: 'userId', operator: 'lte', value: 2 }],
          },
        },
      },
      {
        id: 'sort1',
        type: 'sort',
        position: { x: 0, y: 200 },
        data: {
          label: 'Sort by id desc',
          config: { field: 'id', direction: 'desc' },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'fetch1', target: 'filter1' },
      { id: 'e2', source: 'filter1', target: 'sort1' },
    ],
  };

  try {
    const result = await executor.execute(fetchFilterSortPipe);
    console.log('✓ Fetch → Filter → Sort pipe executed');
    console.log(`  Result count: ${result.length}`);
    console.log(`  First post id: ${result[0].id}`);
    console.log(`  Last post id: ${result[result.length - 1].id}`);
    console.log(`  Sorted descending: ${result[0].id > result[result.length - 1].id}`);
  } catch (error: any) {
    console.log(`✗ Failed: ${error.message}`);
  }

  // Test 4: Pipe with Fetch → Transform
  console.log('\nTest 4: Pipe with Fetch → Transform');
  const fetchTransformPipe: PipeDefinition = {
    nodes: [
      {
        id: 'fetch1',
        type: 'fetch',
        position: { x: 0, y: 0 },
        data: {
          label: 'Fetch Posts',
          config: { url: 'https://jsonplaceholder.typicode.com/posts' },
        },
      },
      {
        id: 'filter1',
        type: 'filter',
        position: { x: 0, y: 100 },
        data: {
          label: 'Filter first 3',
          config: {
            rules: [{ field: 'id', operator: 'lte', value: 3 }],
          },
        },
      },
      {
        id: 'transform1',
        type: 'transform',
        position: { x: 0, y: 200 },
        data: {
          label: 'Transform',
          config: {
            mappings: [
              { source: 'id', target: 'postId' },
              { source: 'title', target: 'postTitle' },
            ],
          },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'fetch1', target: 'filter1' },
      { id: 'e2', source: 'filter1', target: 'transform1' },
    ],
  };

  try {
    const result = await executor.execute(fetchTransformPipe);
    console.log('✓ Fetch → Filter → Transform pipe executed');
    console.log(`  Result count: ${result.length}`);
    console.log(`  Has postId: ${result[0].postId !== undefined}`);
    console.log(`  Has postTitle: ${result[0].postTitle !== undefined}`);
    console.log(`  No userId: ${result[0].userId === undefined}`);
  } catch (error: any) {
    console.log(`✗ Failed: ${error.message}`);
  }

  // Test 5: Empty pipe (should fail)
  console.log('\nTest 5: Empty pipe (should fail)');
  const emptyPipe: PipeDefinition = {
    nodes: [],
    edges: [],
  };

  try {
    await executor.execute(emptyPipe);
    console.log('✗ Should have thrown error');
  } catch (error: any) {
    console.log(`✓ Correctly rejected: ${error.message}`);
  }

  // Test 6: Pipe with cycle (should fail)
  console.log('\nTest 6: Pipe with cycle (should fail)');
  const cyclePipe: PipeDefinition = {
    nodes: [
      {
        id: 'filter1',
        type: 'filter',
        position: { x: 0, y: 0 },
        data: {
          label: 'Filter',
          config: { rules: [] },
        },
      },
      {
        id: 'sort1',
        type: 'sort',
        position: { x: 0, y: 100 },
        data: {
          label: 'Sort',
          config: { field: 'id', direction: 'asc' },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'filter1', target: 'sort1' },
      { id: 'e2', source: 'sort1', target: 'filter1' }, // Cycle!
    ],
  };

  try {
    await executor.execute(cyclePipe);
    console.log('✗ Should have thrown error');
  } catch (error: any) {
    console.log(`✓ Correctly detected cycle: ${error.message}`);
  }

  console.log('\n✓ All tests completed!');
}

testPipeExecutor().catch(console.error);
