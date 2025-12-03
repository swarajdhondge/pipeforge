import { TransformOperator } from '../operators/transform-operator';

async function testTransformOperator() {
  console.log('Testing Transform Operator...\n');

  const operator = new TransformOperator();

  // Test data
  const testData = [
    {
      id: 1,
      user: { name: 'Alice', email: 'alice@example.com' },
      profile: { age: 25, city: 'New York' },
      score: 92.0
    },
    {
      id: 2,
      user: { name: 'Bob', email: 'bob@example.com' },
      profile: { age: 30, city: 'San Francisco' },
      score: 88.7
    },
  ];

  // Test 1: Validate valid config
  console.log('Test 1: Validate valid config');
  const validResult = operator.validate({
    mappings: [
      { source: 'user.name', target: 'name' },
      { source: 'score', target: 'points' }
    ]
  });
  console.log(`✓ Valid config: ${validResult.valid}`);

  // Test 2: Validate missing mappings
  console.log('\nTest 2: Validate missing mappings');
  const missingResult = operator.validate({});
  console.log(`✓ Missing mappings rejected: ${!missingResult.valid}`);
  console.log(`  Error: ${missingResult.error}`);

  // Test 3: Validate invalid mapping
  console.log('\nTest 3: Validate invalid mapping');
  const invalidResult = operator.validate({
    mappings: [{ source: 'user.name' }] // missing target
  });
  console.log(`✓ Invalid mapping rejected: ${!invalidResult.valid}`);
  console.log(`  Error: ${invalidResult.error}`);

  // Test 4: Transform array with simple mappings
  console.log('\nTest 4: Transform array with simple mappings');
  const simpleResult = await operator.execute(testData, {
    mappings: [
      { source: 'user.name', target: 'name' },
      { source: 'score', target: 'points' }
    ]
  });
  console.log(`✓ Transformed ${simpleResult.length} items:`);
  console.log(JSON.stringify(simpleResult, null, 2));

  // Test 5: Transform with nested target
  console.log('\nTest 5: Transform with nested target');
  const nestedResult = await operator.execute(testData, {
    mappings: [
      { source: 'user.name', target: 'person.fullName' },
      { source: 'user.email', target: 'person.contact.email' },
      { source: 'profile.city', target: 'location' }
    ]
  });
  console.log(`✓ Transformed with nested targets:`);
  console.log(JSON.stringify(nestedResult[0], null, 2));

  // Test 6: Transform with missing source fields
  console.log('\nTest 6: Transform with missing source fields');
  const missingFieldResult = await operator.execute(testData, {
    mappings: [
      { source: 'user.name', target: 'name' },
      { source: 'nonexistent.field', target: 'missing' }
    ]
  });
  console.log(`✓ Transformed with missing fields:`);
  console.log(JSON.stringify(missingFieldResult[0], null, 2));

  // Test 7: Transform single object
  console.log('\nTest 7: Transform single object');
  const singleResult = await operator.execute(testData[0], {
    mappings: [
      { source: 'user.name', target: 'name' },
      { source: 'profile.age', target: 'age' },
      { source: 'score', target: 'score' }
    ]
  });
  console.log(`✓ Transformed single object:`);
  console.log(JSON.stringify(singleResult, null, 2));

  // Test 8: Transform with flattening
  console.log('\nTest 8: Transform with flattening');
  const flattenResult = await operator.execute(testData, {
    mappings: [
      { source: 'id', target: 'id' },
      { source: 'user.name', target: 'userName' },
      { source: 'user.email', target: 'userEmail' },
      { source: 'profile.age', target: 'age' },
      { source: 'profile.city', target: 'city' }
    ]
  });
  console.log(`✓ Flattened structure:`);
  console.log(JSON.stringify(flattenResult[0], null, 2));

  // Test 9: Transform with restructuring
  console.log('\nTest 9: Transform with restructuring');
  const restructureResult = await operator.execute(testData, {
    mappings: [
      { source: 'user.name', target: 'details.name' },
      { source: 'profile.age', target: 'details.age' },
      { source: 'score', target: 'metrics.score' }
    ]
  });
  console.log(`✓ Restructured data:`);
  console.log(JSON.stringify(restructureResult[0], null, 2));

  // Test 10: Empty mappings
  console.log('\nTest 10: Empty mappings');
  const emptyMappingsResult = await operator.execute(testData, { mappings: [] });
  console.log(`✓ Empty mappings returned empty objects: ${emptyMappingsResult.length === 2}`);
  console.log(JSON.stringify(emptyMappingsResult, null, 2));

  console.log('\n✓ All tests completed!');
}

testTransformOperator().catch(console.error);
