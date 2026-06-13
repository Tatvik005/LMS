const email = `student_${Date.now()}@test.com`;

async function testAuth() {
  const baseURL = 'http://localhost:5005/api/auth';
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

  // --- REGISTER ---
  await runTest('Test 1: POST /register', async () => {
    const res = await fetch(`${baseURL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Test Student", email, password: "Test@1234", role: "STUDENT" })
    });
    const data = await res.json();
    assert(res.status === 201 || res.status === 200, `Expected 201/200, got ${res.status}. Response: ${JSON.stringify(data)}`);
    assert(data.user, 'Missing user object');
    assert(data.user.password === undefined, 'Password should not be in response');
    assert(data.accessToken, 'Missing accessToken');
    assert(data.refreshToken, 'Missing refreshToken');
  });

  await runTest('Test 2: POST /register (duplicate)', async () => {
    const res = await fetch(`${baseURL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Test Student 2", email, password: "Test@1234", role: "STUDENT" })
    });
    assert(res.status === 400 || res.status === 409, `Expected 400/409, got ${res.status}`);
  });

  await runTest('Test 3: POST /register (missing password)', async () => {
    const res = await fetch(`${baseURL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "X", email: "x@test.com" })
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await runTest('Test 4: POST /register (SUPER_ADMIN)', async () => {
    const res = await fetch(`${baseURL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Hacker", email: "hack@test.com", password: "Test@1234", role: "SUPER_ADMIN" })
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  // --- LOGIN ---
  await runTest('Test 5: POST /login', async () => {
    const res = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: "Test@1234" })
    });
    const data = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}. Response: ${JSON.stringify(data)}`);
    assert(data.accessToken, 'Missing accessToken');
    tokens.accessToken = data.accessToken;
    tokens.refreshToken = data.refreshToken;
  });

  await runTest('Test 6: POST /login (wrong password)', async () => {
    const res = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: "wrongpass" })
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await runTest('Test 7: POST /login (non-existent)', async () => {
    const res = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "nobody@test.com", password: "Test@1234" })
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // --- ME ---
  await runTest('Test 8: GET /me', async () => {
    const res = await fetch(`${baseURL}/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(data.user.email === email, 'Email mismatch');
  });

  await runTest('Test 9: GET /me (no token)', async () => {
    const res = await fetch(`${baseURL}/me`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // --- REFRESH ---
  await runTest('Test 10: POST /refresh', async () => {
    const res = await fetch(`${baseURL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken })
    });
    const data = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}. Response: ${JSON.stringify(data)}`);
    assert(data.accessToken, 'Missing accessToken');
  });

  await runTest('Test 11: POST /refresh (fake token)', async () => {
    const res = await fetch(`${baseURL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: "fakefakefake" })
    });
    assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`);
  });

  // --- LOGOUT ---
  await runTest('Test 12: POST /logout', async () => {
    const res = await fetch(`${baseURL}/logout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}` 
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);

    const res2 = await fetch(`${baseURL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken })
    });
    assert(res2.status === 401, `Expected 401 for deleted refresh token, got ${res2.status}`);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
}

testAuth();
