async function runE2E() {
  const baseURL = 'http://localhost:5005/api';
  let passed = 0;
  let failed = 0;
  
  let E2E_STUDENT_TOKEN = null;
  let E2E_FACULTY_TOKEN = null;
  let E2E_ADMIN_TOKEN = null;
  
  let notifId = null;
  let facultyUserId = null;

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

  const request = async (method, path, token, body = null) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';
    
    const res = await fetch(`${baseURL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    
    // Attempt parsing JSON unless it's CSV
    let data = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try { data = await res.json(); } catch(e) {}
    } else if (contentType && contentType.includes('text/csv')) {
      data = await res.text();
    }
    
    return { status: res.status, data, contentType };
  };

  console.log('--- STARTING E2E VALIDATION ---\n');

  await runTest('Step 2: Register new Student', async () => {
    const { status, data } = await request('POST', '/auth/register', null, {
      name: "E2E Student", email: "e2e_student@test.com", password: "E2E@1234", role: "STUDENT"
    });
    testAssert(status === 201, `Expected 201, got ${status}`);
    E2E_STUDENT_TOKEN = data.accessToken; // implicitly logs them in
  });

  await runTest('Step 3: Register new Faculty', async () => {
    const { status, data } = await request('POST', '/auth/register', null, {
      name: "E2E Faculty", email: "e2e_faculty@test.com", password: "E2E@1234", role: "FACULTY"
    });
    testAssert(status === 201, `Expected 201, got ${status}`);
    E2E_FACULTY_TOKEN = data.accessToken;
    facultyUserId = data.user.id;
  });

  await runTest('Steps 4/5/6: Verify tokens & Login as Super Admin', async () => {
    testAssert(E2E_STUDENT_TOKEN, 'Student token missing');
    testAssert(E2E_FACULTY_TOKEN, 'Faculty token missing');
    
    const { status, data } = await request('POST', '/auth/login', null, {
      email: 'admin@lms.com', password: 'Admin@123'
    });
    testAssert(status === 200, `Expected 200, got ${status}`);
    E2E_ADMIN_TOKEN = data.accessToken;
  });

  await runTest('Step 7: Student hits GET /test/admin', async () => {
    const { status } = await request('GET', '/test/admin', E2E_STUDENT_TOKEN);
    testAssert(status === 403, `Expected 403, got ${status}`);
  });

  await runTest('Step 8: Faculty hits GET /test/admin', async () => {
    const { status } = await request('GET', '/test/admin', E2E_FACULTY_TOKEN);
    testAssert(status === 403, `Expected 403, got ${status}`);
  });

  await runTest('Step 9: Admin hits GET /test/admin', async () => {
    const { status } = await request('GET', '/test/admin', E2E_ADMIN_TOKEN);
    testAssert(status === 200, `Expected 200, got ${status}`);
  });

  await runTest('Step 10: Admin creates a new user', async () => {
    const { status, data } = await request('POST', '/admin/users', E2E_ADMIN_TOKEN, {
      name: "Created User", email: "created@test.com", password: "Pass@123", role: "STUDENT"
    });
    testAssert(status === 201, `Expected 201, got ${status}`);
  });

  await runTest('Step 11: Admin views analytics', async () => {
    const { status, data } = await request('GET', '/admin/analytics', E2E_ADMIN_TOKEN);
    testAssert(status === 200, `Expected 200, got ${status}`);
    testAssert(typeof data.totalStudents === 'number', 'Missing totalStudents');
  });

  await runTest('Step 12: Admin downloads report (CSV)', async () => {
    const { status, data, contentType } = await request('GET', '/admin/reports/users?format=csv', E2E_ADMIN_TOKEN);
    testAssert(status === 200, `Expected 200, got ${status}`);
    testAssert(contentType.includes('text/csv'), 'Not a CSV response');
    testAssert(data.includes('ID') || data.includes('"ID"'), `CSV missing headers. Got: ${data.substring(0, 50)}`);
  });

  let studentUserId = null;
  await runTest('Step 13: Admin sends notification to E2E Student', async () => {
    const { data: userData } = await request('GET', '/auth/me', E2E_STUDENT_TOKEN);
    studentUserId = userData.user.id;

    const { status, data } = await request('POST', '/notifications/send', E2E_ADMIN_TOKEN, {
      userId: studentUserId, title: "E2E Notif", message: "E2E Message"
    });
    testAssert(status === 201, `Expected 201, got ${status}. Server responded: ${JSON.stringify(data)}`);
    notifId = data.id;
  });

  await runTest('Step 14: Student reads notification', async () => {
    const { status, data } = await request('GET', '/notifications', E2E_STUDENT_TOKEN);
    testAssert(status === 200, `Expected 200, got ${status}`);
    testAssert(data.some(n => n.id === notifId), 'Notification missing');
  });

  await runTest('Step 15: Student marks it read', async () => {
    const { status } = await request('PUT', `/notifications/${notifId}/read`, E2E_STUDENT_TOKEN);
    testAssert(status === 200, `Expected 200, got ${status}`);
  });

  await runTest('Step 16: Admin soft-deletes E2E Faculty', async () => {
    const { status } = await request('DELETE', `/admin/users/${facultyUserId}`, E2E_ADMIN_TOKEN);
    testAssert(status === 200, `Expected 200, got ${status}`);
  });

  await runTest('Step 17: Attempt login as deleted Faculty', async () => {
    const { status } = await request('POST', '/auth/login', null, {
      email: "e2e_faculty@test.com", password: "E2E@1234"
    });
    testAssert(status === 401, `Expected 401, got ${status}`);
  });

  console.log(`\n✅ E2E validation completed: ${passed} passed, ${failed} failed`);
}

runE2E();
