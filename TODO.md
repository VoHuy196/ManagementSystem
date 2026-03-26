# ManagementSystem Upgrade TODO
Track progress of implementing full project management features.

## Pending Steps (Mark [x] when complete)

### 1. Backend Models Updates/Creations [ ]
- [x] Update projects.model.js: Add startDate, endDate, department, budget
- [x] Update tasks.model.js: Add taskType(enum), startDate, dueDate, sprint, labels
- [x] Create employees.model.js (separate from User): employee_code, name, birthday, join_date
- [x] Create worklog.model.js: entryDate, task, hours, description, user

### 2. Backend Controllers & Routes [ ]
- [x] Update projects.controller.js: Handle new fields in create/update
- [x] Update task.controller.js: Handle new task fields
- [x] Create employees.controller.js: CRUD
- [x] Create worklog.controller.js: CRUD (create/log work for task)
- [x] Add routes: /employees, /worklogs
- [x] Update app.js: Import new routes

### 3. Frontend Services [ ]
- [x] Update projectApi.js & taskApi.js
- [x] Create employeeApi.js
- [x] Create worklogApi.js

### 4. Frontend UI Components [ ]
- [x] Create ProjectModal.jsx (similar to TaskModal)
- [x] Update TaskModal.jsx: Add new fields (type, dates, sprint, labels)
- [x] Create EmployeeModal.jsx
- [x] Create WorklogModal.jsx
- [x] Update ProjectDashboard.jsx: Add Recharts pie/bar charts
- [x] Update ProjectsList.jsx, TaskCard.jsx, ProjectTasks.jsx: Display new fields
- [ ] Update TaskAssignment.jsx if needed

### 5. Frontend Pages & Routing [ ]
- [x] Create Employees.jsx page
- [x] Create Worklogs.jsx page
- [ ] Update Projects.jsx: Add project create button/modal
- [x] Update Routes.jsx: Add new pages

### 6. Dependencies & Testing [ ]
- [x] Frontend: npm install recharts react-datepicker
- [ ] Backend: Restart server, test new APIs
- [ ] Test all flows: Create project/task/employee/worklog, assign, charts
- [ ] Socket.io realtime for new features

**Next Step**: Start with Backend Models → Controllers → Frontend step-by-step.

Updated after each major step.

