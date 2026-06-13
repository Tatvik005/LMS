const { io } = require('./frontend/node_modules/socket.io-client');

async function testNotifications() {
  const baseURL = 'http://localhost:5005/api';
  let passed = 0;
  let failed = 0;
  let tokens = {};
  let studentId = null;
  let notifId = null;

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
    
    const facultyData = await login('faculty1@lms.com', 'Faculty@123');
    tokens.FACULTY = facultyData.token;
    
    const studentData = await login('student1@test.com', 'Test@1234');
    tokens.STUDENT = studentData.token;
    studentId = studentData.id;
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

  // --- REST API ---
  await runTest('Test 1: POST /notifications/send', async () => {
    const { status, data } = await request('POST', '/notifications/send', tokens.ADMIN, {
      userId: studentId, title: "Test Notification", message: "Hello from Admin"
    });
    testAssert(status === 201 || status === 200, `Expected 201/200, got ${status}. ${data?.message || ''}`);
    testAssert(data.id, 'Missing notification id');
    notifId = data.id;
  });

  await runTest('Test 2: GET /notifications', async () => {
    const { status, data } = await request('GET', '/notifications', tokens.STUDENT);
    testAssert(status === 200, `Expected 200, got ${status}`);
    testAssert(Array.isArray(data), 'Expected array');
    testAssert(data.some(n => n.id === notifId), 'Notification not found in list');
  });

  await runTest('Test 3: GET /notifications?unreadOnly=true', async () => {
    const { status, data } = await request('GET', '/notifications?unreadOnly=true', tokens.STUDENT);
    testAssert(status === 200, `Expected 200, got ${status}`);
    const notif = data.find(n => n.id === notifId);
    testAssert(notif, 'Notification not found in list');
    testAssert(notif.isRead === false, 'isRead should be false');
  });

  await runTest('Test 4: PUT /notifications/:id/read', async () => {
    testAssert(notifId, 'Skip: missing notif ID');
    const { status } = await request('PUT', `/notifications/${notifId}/read`, tokens.STUDENT);
    testAssert(status === 200, `Expected 200, got ${status}`);
    
    const { data } = await request('GET', '/notifications?unreadOnly=true', tokens.STUDENT);
    testAssert(!data.some(n => n.id === notifId), 'Notification still marked as unread');
  });

  await runTest('Test 5: GET /notifications (different user)', async () => {
    const { status, data } = await request('GET', '/notifications', tokens.FACULTY);
    testAssert(status === 200, `Expected 200, got ${status}`);
    testAssert(!data.some(n => n.id === notifId), 'Faculty saw student notification');
  });

  await runTest('Test 6: PUT /notifications/read-all', async () => {
    for (let i = 0; i < 3; i++) {
      await request('POST', '/notifications/send', tokens.ADMIN, {
        userId: studentId, title: "Bulk", message: "Bulk msg"
      });
    }
    const { status } = await request('PUT', '/notifications/read-all', tokens.STUDENT);
    testAssert(status === 200, `Expected 200, got ${status}`);

    const { data } = await request('GET', '/notifications?unreadOnly=true', tokens.STUDENT);
    testAssert(data.length === 0, 'Unread list should be empty');
  });

  await runTest('Test 7: DELETE /notifications/:id', async () => {
    testAssert(notifId, 'Skip: missing notif ID');
    const { status } = await request('DELETE', `/notifications/${notifId}`, tokens.STUDENT);
    testAssert(status === 200, `Expected 200, got ${status}`);

    const { data } = await request('GET', '/notifications', tokens.STUDENT);
    testAssert(!data.some(n => n.id === notifId), 'Deleted notification still appearing');
  });

  await runTest('Test 8: DELETE /notifications/:id (using ADMIN_TOKEN on student notif)', async () => {
    const { data: nData } = await request('POST', '/notifications/send', tokens.ADMIN, {
      userId: studentId, title: "A", message: "B"
    });
    const newId = nData.id;
    testAssert(newId, 'Failed to create notif for test 8');

    const { status } = await request('DELETE', `/notifications/${newId}`, tokens.ADMIN);
    testAssert(status === 403, `Expected 403, got ${status}`);
  });

  await runTest('Test 9: POST /notifications/send (with STUDENT_TOKEN)', async () => {
    const { status } = await request('POST', '/notifications/send', tokens.STUDENT, {
      userId: studentId, title: "Hack", message: "Hack msg"
    });
    testAssert(status === 403, `Expected 403, got ${status}`);
  });

  // --- SOCKET.IO ---
  await runTest('Test 10: Real-time delivery test', async () => {
    return new Promise((resolve, reject) => {
      const socket = io('http://localhost:5005', {
        auth: {
          token: tokens.STUDENT
        }
      });

      let timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Timeout waiting for notification'));
      }, 3000);

      socket.on('new_notification', (payload) => {
        try {
          testAssert(payload.title === "Socket Test", 'Wrong title');
          testAssert(payload.message === "Socket Message", 'Wrong message');
          testAssert(payload.isRead === false, 'isRead should be false');
          clearTimeout(timeout);
          socket.disconnect();
          resolve();
        } catch(e) {
          clearTimeout(timeout);
          socket.disconnect();
          reject(e);
        }
      });

      socket.on('connect', async () => {
        const { status } = await request('POST', '/notifications/send', tokens.ADMIN, {
          userId: studentId, title: "Socket Test", message: "Socket Message"
        });
        if (status !== 201 && status !== 200) {
          clearTimeout(timeout);
          socket.disconnect();
          reject(new Error(`Failed to send via API: ${status}`));
        }
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(err);
      });
    });
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
}

testNotifications();
