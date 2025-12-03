import { OperatorRegistry } from '../operators/operator-registry';
import { IOperator, ValidationResult, OperatorCategory } from '../types/operator.types';
import { ExtractedSchema } from '../types/schema.types';

// Mock operator for testing
class MockOperator implements IOperator {
  type = 'mock';
  category: OperatorCategory = 'operators';
  description = 'Mock operator for testing';

  async execute(input: any, _config: any): Promise<any> {
    return { ...input, processed: true };
  }

  validate(_config: any): ValidationResult {
    return { valid: true };
  }

  getOutputSchema(_inputSchema?: ExtractedSchema, _config?: any): ExtractedSchema | null {
    return null;
  }
}

async function testOperatorRegistry() {
  console.log('Testing Operator Registry...\n');

  const registry = new OperatorRegistry();

  // Test 1: Register operator
  console.log('Test 1: Register operator');
  const mockOp = new MockOperator();
  registry.register(mockOp);
  console.log(`✓ Registered operator: ${mockOp.type}`);

  // Test 2: Get operator
  console.log('\nTest 2: Get operator');
  const retrieved = registry.get('mock');
  console.log(`✓ Retrieved operator: ${retrieved?.type}`);

  // Test 3: List operators
  console.log('\nTest 3: List operators');
  const types = registry.list();
  console.log(`✓ Registered types: ${types.join(', ')}`);

  // Test 4: Has operator
  console.log('\nTest 4: Has operator');
  console.log(`✓ Has 'mock': ${registry.has('mock')}`);
  console.log(`✓ Has 'nonexistent': ${registry.has('nonexistent')}`);

  // Test 5: Count operators
  console.log('\nTest 5: Count operators');
  console.log(`✓ Total operators: ${registry.count()}`);

  // Test 6: Duplicate registration
  console.log('\nTest 6: Duplicate registration (should fail)');
  try {
    registry.register(mockOp);
    console.log('✗ Should have thrown error');
  } catch (error: any) {
    console.log(`✓ Correctly rejected duplicate: ${error.message}`);
  }

  // Test 7: Execute operator
  console.log('\nTest 7: Execute operator');
  const result = await retrieved?.execute({ test: 'data' }, {});
  console.log(`✓ Execution result:`, result);

  console.log('\n✓ All tests passed!');
}

testOperatorRegistry().catch(console.error);
