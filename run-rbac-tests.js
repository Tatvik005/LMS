const jwt = require('jsonwebtoken');

async function testRBAC() {
  const baseURL = 'http://localhost:5005/api';
  let passed = 0;
  let failed = 0;
  let tokens = {};

  const assert = (condition, msg) => {
    if (!condition) {
      throw new Error(msg);
    }
  }

  const runTest = async (name, fn) => {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (e) {
      console.log(`❌ ${name}`);
      console.log(`   ${e.message}`);
      failed++;
    }
  }

  // Login wrappers
  const login = async (email, password) => {
    const res = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    assert(res.status === 200, `Login failed for ${email}`);
    return data.accessToken;
  }

  // Create student if needed
  try {
    await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Student 1', email: 'student1@test.com', password: 'Test@1234', role: 'STUDENT' })
    });
  } catch(e) {}

  try {
    tokens.ADMIN = await login('admin@lms.com', 'Admin@123');
    tokens.FACULTY = await login('faculty1@lms.com', 'Faculty@123');
    tokens.STUDENT = await login('student1@test.com', 'Test@1234');
    console.log('✅ Logged in successfully');
  } catch (e) {
    console.error('Failed to login:', e.message);
    return;
  }

  const hitRoute = async (path, token) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseURL}${path}`, { headers });
    return res.status;
  };

  // --- /api/test/admin ---
  await runTest('Test 1: ADMIN_TOKEN -> Expect 200', async () => {
    const status = await hitRoute('/test/admin', tokens.ADMIN);
    assert(status === 200, `Expected 200, got ${status}`);
  });
  await runTest('Test 2: FACULTY_TOKEN -> Expect 403', async () => {
    const status = await hitRoute('/test/admin', tokens.FACULTY);
    assert(status === 403, `Expected 403, got ${status}`);
  });
  await runTest('Test 3: STUDENT_TOKEN -> Expect 403', async () => {
    const status = await hitRoute('/test/admin', tokens.STUDENT);
    assert(status === 403, `Expected 403, got ${status}`);
  });
  await runTest('Test 4: No token -> Expect 401', async () => {
    const status = await hitRoute('/test/admin', null);
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // --- /api/test/faculty ---
  await runTest('Test 5: FACULTY_TOKEN -> Expect 200', async () => {
    const status = await hitRoute('/test/faculty', tokens.FACULTY);
    assert(status === 200, `Expected 200, got ${status}`);
  });
  await runTest('Test 6: ADMIN_TOKEN -> Expect 403', async () => {
    const status = await hitRoute('/test/faculty', tokens.ADMIN);
    assert(status === 403, `Expected 403, got ${status}`);
  });
  await runTest('Test 7: STUDENT_TOKEN -> Expect 403', async () => {
    const status = await hitRoute('/test/faculty', tokens.STUDENT);
    assert(status === 403, `Expected 403, got ${status}`);
  });
  await runTest('Test 8: No token -> Expect 401', async () => {
    const status = await hitRoute('/test/faculty', null);
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // --- /api/test/student ---
  await runTest('Test 9: STUDENT_TOKEN -> Expect 200', async () => {
    const status = await hitRoute('/test/student', tokens.STUDENT);
    assert(status === 200, `Expected 200, got ${status}`);
  });
  await runTest('Test 10: ADMIN_TOKEN -> Expect 403', async () => {
    const status = await hitRoute('/test/student', tokens.ADMIN);
    assert(status === 403, `Expected 403, got ${status}`);
  });
  await runTest('Test 11: FACULTY_TOKEN -> Expect 403', async () => {
    const status = await hitRoute('/test/student', tokens.FACULTY);
    assert(status === 403, `Expected 403, got ${status}`);
  });
  await runTest('Test 12: No token -> Expect 401', async () => {
    const status = await hitRoute('/test/student', null);
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // --- /api/test/staff ---
  await runTest('Test 13: ADMIN_TOKEN -> Expect 200', async () => {
    const status = await hitRoute('/test/staff', tokens.ADMIN);
    assert(status === 200, `Expected 200, got ${status}`);
  });
  await runTest('Test 14: FACULTY_TOKEN -> Expect 200', async () => {
    const status = await hitRoute('/test/staff', tokens.FACULTY);
    assert(status === 200, `Expected 200, got ${status}`);
  });
  await runTest('Test 15: STUDENT_TOKEN -> Expect 403', async () => {
    const status = await hitRoute('/test/staff', tokens.STUDENT);
    assert(status === 403, `Expected 403, got ${status}`);
  });
  await runTest('Test 16: No token -> Expect 401', async () => {
    const status = await hitRoute('/test/staff', null);
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // --- Tampered tokens ---
  await runTest('Test 17: Tampered token -> Expect 401', async () => {
    const tampered = tokens.ADMIN.substring(0, tokens.ADMIN.length - 1) + 'X';
    const status = await hitRoute('/test/admin', tampered);
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await runTest('Test 18: Expired token -> Expect 401', async () => {
    const JWT_SECRET = 'testsecret'; // Must match backend
    const expiredToken = jwt.sign({ id: '123', email: 'test@test.com', role: 'STUDENT' }, JWT_SECRET, { expiresIn: '-1s' });
    const status = await hitRoute('/test/student', expiredToken);
    assert(status === 401, `Expected 401, got ${status}`);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
}

testRBAC();
