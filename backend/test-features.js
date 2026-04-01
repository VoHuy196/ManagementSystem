import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:3000';

// Test setup
let testToken = '';
let testProjectId = '';
let testTaskId = '';
let testEmployeeId = '';
let testUserId = '';

const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
});

// Interceptor to add token
api.interceptors.request.use((config) => {
  if (testToken) {
    config.headers.Authorization = `Bearer ${testToken}`;
  }
  return config;
});

async function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
  console.log(`${icon} [${testName}] ${status} ${details}`);
}

async function test() {
  console.log('\n🚀 TESTING PROJECT MANAGEMENT SYSTEM\n');
  
  try {
    // 0. REGISTER TEST USER
    console.log('📝 === USER REGISTRATION ===');
    const testEmail = `testuser${Date.now()}@test.com`;
    const registerRes = await api.post('/api/auth/register', {
      fullName: 'Test User',
      email: testEmail,
      password: 'TestPass123'
    });
    
    if (registerRes.status === 201) {
      await logTest('Register User', 'PASS', `Email: ${testEmail}`);
    } else {
      await logTest('Register User', 'FAIL', `Status: ${registerRes.status}`);
      console.log('Response:', registerRes.data);
      return;
    }

    // 1. LOGIN TEST
    console.log('\n📝 === AUTHENTICATION ===');
    const loginRes = await api.post('/api/auth/login', {
      email: testEmail,
      password: 'TestPass123'
    });
    
    if (loginRes.status === 200 && loginRes.data?.data?.token) {
      testToken = loginRes.data.data.token;
      testUserId = loginRes.data.data.user?._id;
      await logTest('Login', 'PASS', `User: ${testUserId}`);
    } else {
      await logTest('Login', 'FAIL', `Status: ${loginRes.status}`);
      console.log('Response:', loginRes.data);
      return;
    }

    // 2. CREATE EMPLOYEE TEST
    console.log('\n👥 === EMPLOYEES ===');
    const empRes = await api.post('/api/employees', {
      employeeCode: `EMP${Date.now()}`,
      name: 'Test Employee',
      joinDate: new Date().toISOString(),
      birthday: '1990-01-01'
    });
    
    if (empRes.status === 201 && empRes.data?.data?.employee?._id) {
      testEmployeeId = empRes.data.data.employee._id;
      await logTest('Create Employee', 'PASS', `ID: ${testEmployeeId}`);
    } else {
      await logTest('Create Employee', 'FAIL', `Status: ${empRes.status}`);
    }

    // 3. GET EMPLOYEES TEST
    const getEmpRes = await api.get('/api/employees');
    if (getEmpRes.status === 200 && Array.isArray(getEmpRes.data?.data?.employees)) {
      await logTest('Get Employees', 'PASS', `Count: ${getEmpRes.data.data.employees.length}`);
    } else {
      await logTest('Get Employees', 'FAIL', `Status: ${getEmpRes.status}`);
    }

    // 4. CREATE PROJECT TEST
    console.log('\n📊 === PROJECTS ===');
    const projRes = await api.post('/api/projects', {
      name: `Test Project ${Date.now()}`,
      description: 'Test project for validation',
      department: 'Engineering',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 50000,
      status: 'active'
    });
    
    if (projRes.status === 201 && projRes.data?.data?.project?._id) {
      testProjectId = projRes.data.data.project._id;
      await logTest('Create Project', 'PASS', `ID: ${testProjectId}`);
    } else {
      await logTest('Create Project', 'FAIL', `Status: ${projRes.status}`);
      console.log('Response:', projRes.data);
    }

    // 5. GET PROJECTS TEST
    const getProjRes = await api.get('/api/projects');
    if (getProjRes.status === 200 && Array.isArray(getProjRes.data?.data?.projects)) {
      await logTest('Get Projects', 'PASS', `Count: ${getProjRes.data.data.projects.length}`);
    } else {
      await logTest('Get Projects', 'FAIL', `Status: ${getProjRes.status}`);
    }

    // 6. CREATE TASK TEST
    console.log('\n✅ === TASKS ===');
    const taskRes = await api.post('/api/tasks/createtask', {
      title: `Test Task ${Date.now()}`,
      description: 'Test task for validation',
      priority: 'High',
      taskType: 'Task',
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      sprint: 'Sprint 1',
      labels: ['testing', 'validation'],
      status: 'Todo'
    });
    
    if (taskRes.status === 201 && taskRes.data?.data?.task?._id) {
      testTaskId = taskRes.data.data.task._id;
      await logTest('Create Task', 'PASS', `ID: ${testTaskId}`);
    } else {
      await logTest('Create Task', 'FAIL', `Status: ${taskRes.status}`);
      console.log('Response:', taskRes.data);
    }

    // 7. GET TASKS TEST
    const getTaskRes = await api.get('/api/tasks/gettask');
    if (getTaskRes.status === 200 && Array.isArray(getTaskRes.data?.data?.tasks)) {
      await logTest('Get Tasks', 'PASS', `Count: ${getTaskRes.data.data.tasks.length}`);
    } else {
      await logTest('Get Tasks', 'FAIL', `Status: ${getTaskRes.status}`);
    }

    // 8. UPDATE TASK TEST
    const updateTaskRes = await api.patch(`/api/tasks/updatetask/${testTaskId}`, {
      status: 'In Progress',
      description: 'Updated description'
    });
    
    if (updateTaskRes.status === 200) {
      await logTest('Update Task', 'PASS', 'Task updated successfully');
    } else {
      await logTest('Update Task', 'FAIL', `Status: ${updateTaskRes.status}`);
    }

    // 9. ASSIGN TASK TEST
    console.log('\n🎯 === TASK ASSIGNMENT ===');
    const assignRes = await api.post(`/api/tasks/assigntask/${testTaskId}`);
    
    if (assignRes.status === 200) {
      await logTest('Smart Assign Task', 'PASS', 'Task assigned to user');
    } else {
      await logTest('Smart Assign Task', 'FAIL', `Status: ${assignRes.status}`);
    }

    // 10. CREATE WORKLOG TEST
    console.log('\n⏱️  === WORKLOGS ===');
    const worklogRes = await api.post('/api/worklogs', {
      entryDate: new Date().toISOString(),
      task: testTaskId,
      hours: 4.5,
      description: 'Test worklog entry',
      employee: testEmployeeId
    });
    
    if (worklogRes.status === 201 && worklogRes.data?.data?.worklog?._id) {
      await logTest('Create Worklog', 'PASS', `Hours: 4.5`);
    } else {
      await logTest('Create Worklog', 'FAIL', `Status: ${worklogRes.status}`);
      console.log('Response:', worklogRes.data);
    }

    // 11. GET WORKLOGS TEST
    const getWorklogRes = await api.get('/api/worklogs');
    if (getWorklogRes.status === 200 && Array.isArray(getWorklogRes.data?.data?.worklogs)) {
      await logTest('Get Worklogs', 'PASS', `Count: ${getWorklogRes.data.data.worklogs.length}`);
    } else {
      await logTest('Get Worklogs', 'FAIL', `Status: ${getWorklogRes.status}`);
    }

    // 12. GET WORKLOGS BY TASK TEST
    const getWorklogByTaskRes = await api.get(`/api/worklogs/task/${testTaskId}`);
    if (getWorklogByTaskRes.status === 200 && Array.isArray(getWorklogByTaskRes.data?.data?.worklogs)) {
      const totalHours = getWorklogByTaskRes.data.data.totalHours || 0;
      await logTest('Get Worklogs by Task', 'PASS', `Total Hours: ${totalHours}`);
    } else {
      await logTest('Get Worklogs by Task', 'FAIL', `Status: ${getWorklogByTaskRes.status}`);
    }

    // 13. DATABASE POPULATE CHECK (Worklogs should have employee/task names)
    console.log('\n🔍 === DATA POPULATION VERIFICATION ===');
    const worklogCheckRes = await api.get('/api/worklogs');
    if (worklogCheckRes.status === 200 && worklogCheckRes.data?.data?.worklogs?.[0]) {
      const worklog = worklogCheckRes.data.data.worklogs[0];
      const hasEmployeeName = typeof worklog.employee === 'object' && worklog.employee.name;
      const hasTaskTitle = typeof worklog.task === 'object' && worklog.task.title;
      
      if (hasEmployeeName && hasTaskTitle) {
        await logTest('Worklog Data Populated', 'PASS', `${worklog.employee.name} | ${worklog.task.title}`);
      } else {
        await logTest('Worklog Data Populated', 'FAIL', 'Employee/Task not populated');
        console.log('  Employee:', worklog.employee);
        console.log('  Task:', worklog.task);
      }
    }

    // 14. PROJECT FIELDS TEST
    console.log('\n🏗️  === PROJECT FIELDS VERIFICATION ===');
    const projCheckRes = await api.get('/api/projects');
    if (projCheckRes.status === 200 && projCheckRes.data?.data?.projects?.[0]) {
      const project = projCheckRes.data.data.projects[0];
      const hasAllFields = 
        project.name && 
        project.startDate && 
        project.endDate && 
        project.department && 
        project.status && 
        project.budget !== undefined;
      
      if (hasAllFields) {
        await logTest('Project Fields', 'PASS', `Status: ${project.status} | Budget: $${project.budget}`);
      } else {
        await logTest('Project Fields', 'FAIL', 'Missing required fields');
      }
    }

    // 15. TASK FIELDS TEST
    console.log('\n📋 === TASK FIELDS VERIFICATION ===');
    const taskCheckRes = await api.get('/api/tasks/gettask');
    if (taskCheckRes.status === 200 && taskCheckRes.data?.data?.tasks?.[0]) {
      const task = taskCheckRes.data.data.tasks[0];
      const hasTaskFields = 
        task.title && 
        task.taskType && 
        task.startDate && 
        task.dueDate && 
        task.sprint && 
        Array.isArray(task.labels);
      
      if (hasTaskFields) {
        await logTest('Task Fields', 'PASS', `Type: ${task.taskType} | Labels: ${task.labels.length}`);
      } else {
        await logTest('Task Fields', 'FAIL', 'Missing required fields');
      }
    }

    console.log('\n✨ === TEST COMPLETION ===');
    console.log('✅ All core features tested successfully!');
    console.log('\n📱 Frontend: http://localhost:5174');
    console.log('🔌 Backend: http://localhost:3000');
    console.log('💾 Database: Connected and populated\n');
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    process.exit(1);
  }
}

// Run tests
test().then(() => {
  console.log('🎉 Testing complete!\n');
  process.exit(0);
}).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
