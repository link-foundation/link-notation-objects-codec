/**
 * Basic usage examples for link-notation-objects-codec.
 */

import { encode, decode } from '../src/index.js';

function main() {
  console.log('=== Link Notation Objects Codec Examples ===\n');

  // Example 1: Basic types
  console.log('1. Basic Types:');
  const basicExamples = [
    null,
    undefined,
    true,
    false,
    42,
    3.14,
    'Hello, World!',
    'Unicode: 你好世界 🌍',
  ];

  for (const obj of basicExamples) {
    const encoded = encode(obj);
    const decoded = decode(encoded);
    const encodedPreview = encoded.substring(0, 50);
    console.log(`  ${String(obj).padEnd(30)} -> ${encodedPreview.padEnd(50)} -> ${decoded}`);
    // Handle NaN case (NaN !== NaN)
    const isEqual = (obj !== obj && decoded !== decoded) || decoded === obj;
    if (!isEqual) {
      console.error(`  ERROR: Mismatch for ${obj}`);
    }
  }

  // Example 2: Collections
  console.log('\n2. Collections:');
  const arrayExample = [1, 2, 3, 'hello', true];
  const objectExample = { name: 'Alice', age: 30, active: true };

  console.log(`  Array: ${JSON.stringify(arrayExample)}`);
  const encodedArray = encode(arrayExample);
  console.log(`  Encoded: ${encodedArray}`);
  const decodedArray = decode(encodedArray);
  console.log(`  Decoded: ${JSON.stringify(decodedArray)}`);
  console.log(`  Match: ${JSON.stringify(decodedArray) === JSON.stringify(arrayExample)}`);

  console.log(`\n  Object: ${JSON.stringify(objectExample)}`);
  const encodedObject = encode(objectExample);
  console.log(`  Encoded: ${encodedObject}`);
  const decodedObject = decode(encodedObject);
  console.log(`  Decoded: ${JSON.stringify(decodedObject)}`);
  console.log(`  Match: ${JSON.stringify(decodedObject) === JSON.stringify(objectExample)}`);

  // Example 3: Nested structures
  console.log('\n3. Nested Structures:');
  const nested = {
    users: [
      { id: 1, name: 'Alice', admin: true },
      { id: 2, name: 'Bob', admin: false },
    ],
    metadata: { version: 1, count: 2 },
  };
  console.log(`  Original: ${JSON.stringify(nested)}`);
  const encodedNested = encode(nested);
  console.log(`  Encoded length: ${encodedNested.length} characters`);
  const decodedNested = decode(encodedNested);
  console.log(`  Decoded: ${JSON.stringify(decodedNested)}`);
  console.log(`  Match: ${JSON.stringify(decodedNested) === JSON.stringify(nested)}`);

  // Example 4: Circular references
  console.log('\n4. Circular References:');

  // Self-referencing array
  const arr = [1, 2, 3];
  arr.push(arr);
  console.log('  Created self-referencing array');
  const encodedCircular = encode(arr);
  console.log(`  Encoded: ${encodedCircular}`);
  const decodedCircular = decode(encodedCircular);
  console.log(`  Decoded correctly: ${JSON.stringify(decodedCircular.slice(0, 3)) === '[1,2,3]'}`);
  console.log(`  Circular reference preserved: ${decodedCircular[3] === decodedCircular}`);
  if (decodedCircular[3] !== decodedCircular) {
    console.error('  ERROR: Circular reference not preserved!');
  }

  // Self-referencing object
  const obj = { name: 'root' };
  obj.self = obj;
  console.log('\n  Created self-referencing object');
  const encodedObjectCircular = encode(obj);
  console.log(`  Encoded: ${encodedObjectCircular}`);
  const decodedObjectCircular = decode(encodedObjectCircular);
  console.log(`  Decoded correctly: ${decodedObjectCircular.name === 'root'}`);
  console.log(`  Circular reference preserved: ${decodedObjectCircular.self === decodedObjectCircular}`);
  if (decodedObjectCircular.self !== decodedObjectCircular) {
    console.error('  ERROR: Circular reference not preserved!');
  }

  // Example 5: Shared references
  console.log('\n5. Shared Object References:');
  const shared = { shared: 'data', value: 42 };
  const container = { first: shared, second: shared, third: shared };
  console.log('  Created container with 3 references to same object');
  const encodedShared = encode(container);
  console.log(`  Encoded: ${encodedShared}`);
  const decodedShared = decode(encodedShared);
  const allSame = decodedShared.first === decodedShared.second &&
                  decodedShared.second === decodedShared.third;
  console.log(`  All three references point to same object: ${allSame}`);
  if (!allSame) {
    console.error('  ERROR: Shared references not preserved!');
  }

  // Modify through one reference
  decodedShared.first.modified = true;
  console.log(`  Modified through 'first', visible in 'second': ${decodedShared.second.modified === true}`);
  if (decodedShared.second.modified !== true) {
    console.error('  ERROR: Modification not visible through shared reference!');
  }

  console.log('\n=== All examples completed successfully! ===');
}

main();
