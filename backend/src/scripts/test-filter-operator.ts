import { FilterOperator } from '../operators/filter-operator';

async function testFilterOperator() {
  console.log('Testing Filter Operator...\n');

  const operator = new FilterOperator();

  // Test data
  const testData = [
    { id: 1, name: 'Alice', age: 25, city: 'New York' },
    { id: 2, name: 'Bob', age: 30, city: 'San Francisco' },
    { id: 3, name: 'Charlie', age: 35, city: 'New York' },
    { id: 4, name: 'David', age: 28, city: 'Boston' },
    { id: 5, name: 'Eve', age: 32, city: 'San Francisco' },
  ];

  // Test 1: Validate valid config
  console.log('Test 1: Validate valid config');
  const validResult = operator.validate({
    rules: [{ field: 'age', operator: 'gt', value: 25 }]
  });
  console.log(`✓ Valid config: ${validResult.valid}`);

  // Test 2: Validate missing rules
  console.log('\nTest 2: Validate missing rules');
  const missingResult = operator.validate({});
  console.log(`✓ Missing rules rejected: ${!missingResult.valid}`);
  console.log(`  Error: ${missingResult.error}`);

  // Test 3: Validate invalid operator
  console.log('\nTest 3: Validate invalid operator');
  const invalidOpResult = operator.validate({
    rules: [{ field: 'age', operator: 'invalid', value: 25 }]
  });
  console.log(`✓ Invalid operator rejected: ${!invalidOpResult.valid}`);
  console.log(`  Error: ${invalidOpResult.error}`);

  // Test 4: Filter with equals
  console.log('\nTest 4: Filter with equals');
  const equalsResult = await operator.execute(testData, {
    rules: [{ field: 'city', operator: 'equals', value: 'New York' }]
  });
  console.log(`✓ Filtered ${equalsResult.length} items (expected 2)`);
  console.log(`  Names: ${equalsResult.map((item: any) => item.name).join(', ')}`);

  // Test 5: Filter with gt (greater than)
  console.log('\nTest 5: Filter with gt (greater than)');
  const gtResult = await operator.execute(testData, {
    rules: [{ field: 'age', operator: 'gt', value: 30 }]
  });
  console.log(`✓ Filtered ${gtResult.length} items (expected 2)`);
  console.log(`  Names: ${gtResult.map((item: any) => item.name).join(', ')}`);

  // Test 6: Filter with contains
  console.log('\nTest 6: Filter with contains');
  const containsResult = await operator.execute(testData, {
    rules: [{ field: 'name', operator: 'contains', value: 'a' }]
  });
  console.log(`✓ Filtered ${containsResult.length} items (expected 3)`);
  console.log(`  Names: ${containsResult.map((item: any) => item.name).join(', ')}`);

  // Test 7: Filter with multiple rules (AND logic)
  console.log('\nTest 7: Filter with multiple rules (AND logic)');
  const multiResult = await operator.execute(testData, {
    rules: [
      { field: 'age', operator: 'gte', value: 30 },
      { field: 'city', operator: 'equals', value: 'San Francisco' }
    ]
  });
  console.log(`✓ Filtered ${multiResult.length} items (expected 2)`);
  console.log(`  Names: ${multiResult.map((item: any) => item.name).join(', ')}`);

  // Test 8: Filter with lte (less than or equal)
  console.log('\nTest 8: Filter with lte (less than or equal)');
  const lteResult = await operator.execute(testData, {
    rules: [{ field: 'age', operator: 'lte', value: 28 }]
  });
  console.log(`✓ Filtered ${lteResult.length} items (expected 2)`);
  console.log(`  Names: ${lteResult.map((item: any) => item.name).join(', ')}`);

  // Test 9: Non-array input (should fail)
  console.log('\nTest 9: Non-array input (should fail)');
  try {
    await operator.execute({ not: 'an array' }, {
      rules: [{ field: 'age', operator: 'gt', value: 25 }]
    });
    console.log('✗ Should have thrown error');
  } catch (error: any) {
    console.log(`✓ Correctly rejected: ${error.message}`);
  }

  // Test 10: Empty rules (should return input unchanged)
  console.log('\nTest 10: Empty rules (should return input unchanged)');
  const emptyRulesResult = await operator.execute(testData, { rules: [] });
  console.log(`✓ Returned ${emptyRulesResult.length} items (expected ${testData.length})`);

  console.log('\n✓ All tests completed!');
}

testFilterOperator().catch(console.error);
