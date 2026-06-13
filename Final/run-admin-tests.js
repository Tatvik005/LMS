async function testAdmin() {
  const baseURL = 'http://localhost:5005/api';
  let passed = 0;
  let failed = 0;
  let tokens = {};
  let adminId = null;
  let newUserId = null;

  const testAssert = (condition, msg) => {
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
    if (res.status !== 200) throw new Error(`Login failed for ${email}`);
    return { token: data.accessToken, id: data.user.id };
  }

  try {
    const adminData = await login('admin@lms.com', 'Admin@123');
    tokens.ADMIN = adminData.token;
    adminId = adminData.id;
    
    const studentData = await login('student1@test.com', 'Test@1234');
    tokens.STUDENT = studentData.token;
    console.log('✅ Logged in successfully');
  } catch (e) {
    console.error('Failed to login:', e.message);
    return;
  }

  const request = async (method, path, token, body = null) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';
    
    const res = await fetch(`${baseURL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    let data = null;
    try { data = await res.json(); } catch(e) {}
    return { status: res.status, data };
  };

  // --- GET ALL USERS ---
  await runTest('Test 1: GET /admin/users', async () => {
    const { status, data } = await request('GET', '/admin/users', tokens.ADMIN);
    testAssert(status === 200, `Expected 200, got ${status}`);
    testAssert(data.users && data.users.length > 0, 'No users returned');
    testAssert(data.total !== undefined, 'Missing total');
    testAssert(data.page !== undefined, 'Missing page');
    testAssert(data.totalPages !== undefined, 'Missing totalPages');
  });

  await runTest('Test 2: GET /admin/users?role=STUDENT', async () => {
    const { status, data } = await request('GET', '/admin/users?role=STUDENT', tokens.ADMIN);
    testAssert(status === 200, `Expected 200, got ${status}`);
    testAssert(data.users.every(u => u.role === 'STUDENT'), 'Not all users are STUDENTS');
  });

  await runTest('Test 3: GET /admin/users?search=faculty', async () => {
    const { status, data } = await request('GET', '/admin/users?search=faculty', tokens.ADMIN);
    testAssert(status === 200, `Expected 200, got ${status}`);
    const found = data.users.some(u => u.email.toLowerCase().includes('faculty') || u.name.toLowerCase().includes('faculty'));
    testAssert(found, 'Search results did not match "faculty"');
  });

  await runTest('Test 4: GET /admin/users?page=1&limit=2', async () => {
    const { status, data } = await request('GET', '/admin/users?page=1&limit=2', tokens.ADMIN);
    testAssert(status === 200, `Expected 200, got ${status}`);
    testAssert(data.users.length <= 2, `Expected max 2 users, got ${data.users.length}`);
  });

  await runTest('Test 5: GET /admin/users (with STUDENT_TOKEN)', async () => {
    const { status } = await request('GET', '/admin/users', tokens.STUDENT);
    testAssert(status === 403, `Expected 403, got ${status}`);
  });

  // --- CREATE USER ---
  const newEmail = `newfaculty_${Date.now()}@lms.com`;
  await runTest('Test 6: POST /admin/users', async () => {
    const { status, data } = await request('POST', '/admin/users', tokens.ADMIN, {
      name: "New Faculty", email: newEmail, password: "Faculty@123", role: "FACULTY"
    });
    testAssert(status === 201 || status === 200, `Expected 201, got ${status}. ${data?.message || ''}`);
    testAssert(data.user && data.user.id, 'Missing user object/id');
    newUserId = data.user.id;
  });

  await runTest('Test 7: POST /admin/users (duplicate email)', async () => {
    const { status } = await request('POST', '/admin/users', tokens.ADMIN, {
      name: "New Faculty", email: newEmail, password: "Faculty@123", role: "FACULTY"
    });
    testAssert(status === 400 || status === 409, `Expected 400/409, got ${status}`);
  });

  await runTest('Test 8: POST /admin/users (missing name)', async () => {
    const { status } = await request('POST', '/admin/users', tokens.ADMIN, {
      email: "x@x.com", password: "Test@1234", role: "STUDENT"
    });
    testAssert(status === 400, `Expected 400, got ${status}`);
  });

  // --- UPDATE USER ---
  await runTest('Test 9: PUT /admin/users/:id', async () => {
    testAssert(newUserId, 'Skip: missing new user ID');
    const { status, data } = await request('PUT', `/admin/users/${newUserId}`, tokens.ADMIN, {
      name: "Updated Faculty Name"
    });
    testAssert(status === 200, `Expected 200, got ${status}`);
    testAssert(data.user.name === "Updated Faculty Name", 'Name not updated');
  });

  await runTest('Test 10: PUT /admin/users/:nonExistentId', async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const { status } = await request('PUT', `/admin/users/${fakeId}`, tokens.ADMIN, { name: "Fake" });
    testAssert(status === 404, `Expected 404, got ${status}`);
  });

  // --- RESET PASSWORD ---
  await runTest('Test 11: PUT /admin/users/:id/reset-password', async () => {
    testAssert(newUserId, 'Skip: missing new user ID');
    const { status, data } = await request('PUT', `/admin/users/${newUserId}/reset-password`, tokens.ADMIN, {
      newPassword: "NewPass@456"
    });
    testAssert(status === 200, `Expected 200, got ${status}. ${data?.message}`);

    const newLoginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: 'NewPass@456' })
    });
    testAssert(newLoginRes.status === 200, 'Login with new password failed');

    const oldLoginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: 'Faculty@123' })
    });
    testAssert(oldLoginRes.status === 401 || oldLoginRes.status === 400, 'Login with old password should fail');
  });

  // --- DELETE USER ---
  await runTest('Test 12: DELETE /admin/users/:id', async () => {
    testAssert(newUserId, 'Skip: missing new user ID');
    const { status, data } = await request('DELETE', `/admin/users/${newUserId}`, tokens.ADMIN);
    testAssert(status === 200, `Expected 200, got ${status}. ${data?.message}`);

    const { status: getStatus, data: getData } = await request('GET', `/admin/users/${newUserId}`, tokens.ADMIN);
    testAssert(getStatus === 404 || (getData && getData.deletedAt !== null), 'User should be marked deleted or 404');
  });

  await runTest('Test 13: Login with deleted user', async () => {
    const loginRes = await fetch(`${baseURL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: 'NewPass@456' })
    });
    testAssert(loginRes.status === 401 || loginRes.status === 400, `Expected 401, got ${loginRes.status}`);
  });

  await runTest('Test 14: DELETE admin own id', async () => {
    const { status } = await request('DELETE', `/admin/users/${adminId}`, tokens.ADMIN);
    testAssert(status === 400, `Expected 400, got ${status}`);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
}

testAdmin();
