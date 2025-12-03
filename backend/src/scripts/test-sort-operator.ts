import { SortOperator } from '../operators/sort-operator';

async function testSortOperator() {
  console.log('Testing Sort Operator...\n');

  const operator = new SortOperator();

  // Test data
  const testData = [
    { id: 3, name: 'Charlie', age: 35, score: 85.5 },
    { id: 1, name: 'Alice', age: 25, score: 92.0 },
    { id: 5, name: 'Eve', age: 32, score: 78.3 },
    { id: 2, name: 'Bob', age: 30, score: 88.7 },
    { id: 4, name: 'David', age: 28, score: 95.2 },
  ];

  // Test 1: Validate valid config
  console.log('Test 1: Validate valid config');
  const validResult = operator.validate({ field: 'age', direction: 'asc' });
  console.log(`✓ Valid config: ${validResult.valid}`);

  // Test 2: Validate missing field
  console.log('\nTest 2: Validate missing field');
  const missingFieldResult = operator.validate({ direction: 'asc' });
  console.log(`✓ Missing field rejected: ${!missingFieldResult.valid}`);
  console.log(`  Error: ${missingFieldResult.error}`);

  // Test 3: Validate invalid direction
  console.log('\nTest 3: Validate invalid direction');
  const invalidDirResult = operator.validate({ field: 'age', direction: 'invalid' });
  console.log(`✓ Invalid direction rejected: ${!invalidDirResult.valid}`);
  console.log(`  Error: ${invalidDirResult.error}`);

  // Test 4: Sort by age ascending
  console.log('\nTest 4: Sort by age ascending');
  const ageAscResult = await operator.execute(testData, { field: 'age', direction: 'asc' });
  console.log(`✓ Sorted by age (asc):`);
  console.log(`  Ages: ${ageAscResult.map((item: any) => item.age).join(', ')}`);
  console.log(`  Names: ${ageAscResult.map((item: any) => item.name).join(', ')}`);

  // Test 5: Sort by age descending
  console.log('\nTest 5: Sort by age descending');
  const ageDescResult = await operator.execute(testData, { field: 'age', direction: 'desc' });
  console.log(`✓ Sorted by age (desc):`);
  console.log(`  Ages: ${ageDescResult.map((item: any) => item.age).join(', ')}`);
  console.log(`  Names: ${ageDescResult.map((item: any) => item.name).join(', ')}`);

  // Test 6: Sort by name ascending
  console.log('\nTest 6: Sort by name ascending');
  const nameAscResult = await operator.execute(testData, { field: 'name', direction: 'asc' });
  console.log(`✓ Sorted by name (asc):`);
  console.log(`  Names: ${nameAscResult.map((item: any) => item.name).join(', ')}`);

  // Test 7: Sort by score descending
  console.log('\nTest 7: Sort by score descending');
  const scoreDescResult = await operator.execute(testData, { field: 'score', direction: 'desc' });
  console.log(`✓ Sorted by score (desc):`);
  console.log(`  Scores: ${scoreDescResult.map((item: any) => item.score).join(', ')}`);
  console.log(`  Names: ${scoreDescResult.map((item: any) => item.name).join(', ')}`);

  // Test 8: Sort with missing fields
  console.log('\nTest 8: Sort with missing fields');
  const dataWithMissing = [
    { id: 1, name: 'Alice', age: 25 },
    { id: 2, name: 'Bob' }, // missing age
    { id: 3, name: 'Charlie', age: 35 },
    { id: 4, name: 'David' }, // missing age
  ];
  const missingFieldsResult = await operator.execute(dataWithMissing, { field: 'age', direction: 'asc' });
  console.log(`✓ Sorted with missing fields:`);
  console.log(`  Names: ${missingFieldsResult.map((item: any) => item.name).join(', ')}`);
  console.log(`  Ages: ${missingFieldsResult.map((item: any) => item.age || 'undefined').join(', ')}`);

  // Test 9: Non-array input (should fail)
  console.log('\nTest 9: Non-array input (should fail)');
  try {
    await operator.execute({ not: 'an array' }, { field: 'age', direction: 'asc' });
    console.log('✗ Should have thrown error');
  } catch (error: any) {
    console.log(`✓ Correctly rejected: ${error.message}`);
  }

  // Test 10: Empty array
  console.log('\nTest 10: Empty array');
  const emptyResult = await operator.execute([], { field: 'age', direction: 'asc' });
  console.log(`✓ Empty array returned: ${emptyResult.length === 0}`);

  console.log('\n✓ All tests completed!');
}

testSortOperator().catch(console.error);
