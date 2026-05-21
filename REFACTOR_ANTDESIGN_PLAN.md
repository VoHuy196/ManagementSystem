# Kế Hoạch Refactor - Chuyển Sang Ant Design + Pro Components + ProTable

## 📋 Tóm Tắt Dự Án
- **Frontend**: React 19 + Vite → Chuyển sang Ant Design 5 ecosystem
- **Backend**: Node.js + Express + MongoDB ✅ (Đã hoàn tất)
- **Thời gian ước tính**: 3-4 tuần
- **Độ phức tạp**: Trung bình - Cao

---

## 🎯 Giai Đoạn 1: Chuẩn Bị & Setup (1-2 ngày)

### 1.1 Cài Đặt Dependencies
```bash
# Frontend dependencies
npm install @ant-design/pro-components
npm install @ant-design/pro-table
npm install @ant-design/icons
npm install antd@latest
npm install @ant-design/cssinjs

# UI Libraries
npm install classnames lodash-es

# Utilities
npm install clsx
```

### 1.2 Dọn Dẹp Tailwind CSS
- **Giữ lại**: Tailwind cơ bản cho spacing/responsive nếu cần
- **Loại bỏ**: Thay thế Tailwind utilities bằng Ant Design
- Cập nhật `tailwind.config.js` hoặc loại bỏ hoàn toàn

### 1.3 Cấu Hình Ant Design Theme
**File mới**: `frontend/src/theme/themeConfig.ts`
```typescript
export const darkTheme = {
  token: {
    colorPrimary: '#1890ff',
    colorBgContainer: '#141414',
    colorBorder: '#434343',
  },
};

export const lightTheme = {
  token: {
    colorPrimary: '#1890ff',
    colorBgContainer: '#ffffff',
  },
};
```

---

## 🎨 Giai Đoạn 2: Cập Nhật Theme System (2-3 ngày)

### 2.1 Refactor ThemeContext
**File**: `frontend/src/context/ThemeContext.jsx` → `ThemeContext.tsx`
- Thay thế Tailwind classes bằng Ant Design theme tokens
- Tích hợp `ConfigProvider` từ Ant Design
- Hỗ trợ dark/light mode bằng Ant Design theme

### 2.2 Cập Nhật ThemeWrapper
```jsx
import { ConfigProvider } from 'antd';
import { darkTheme, lightTheme } from '@/theme/themeConfig';

export function ThemeWrapper({ children }) {
  const { isDark } = useTheme();
  return (
    <ConfigProvider theme={isDark ? darkTheme : lightTheme}>
      {children}
    </ConfigProvider>
  );
}
```

### 2.3 Cập Nhật ThemeSettings Component
- Sử dụng Ant Design `Select`, `Space`, `Button` thay vì HTML
- Loại bỏ Tailwind classes

---

## 📊 Giai Đoạn 3: Refactor Components (7-10 ngày)

### 3.1 Layout Components
| Component | Cũ | Mới | Độ ưu tiên |
|-----------|----|----|-----------|
| Header | Tailwind | Ant Layout + Menu | 🔴 Cao |
| Footer | Tailwind | Ant Layout.Footer | 🔴 Cao |
| Sidebar/Navigation | Tailwind | Ant Menu + Layout.Sider | 🔴 Cao |
| Layout.jsx | Custom CSS | Ant Layout | 🔴 Cao |

**Thực hiện**:
```jsx
import { Layout, Menu } from 'antd';
const { Header, Sider, Content, Footer } = Layout;

export function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header>/* Logo + Menu */</Header>
      <Layout>
        <Sider>/* Navigation Menu */</Sider>
        <Content>/* Page Content */</Content>
      </Layout>
      <Footer>/* Footer */</Footer>
    </Layout>
  );
}
```

### 3.2 Form Components
| Component | Cũ | Mới | Độ ưu tiên |
|-----------|----|----|-----------|
| EmployeeModal | HTML form | Ant Form + Modal | 🟡 Trung |
| ProjectModal | HTML form | Ant Form + Modal | 🟡 Trung |
| TaskModal | HTML form | Ant Form + Modal | 🟡 Trung |
| WorklogModal | HTML form | Ant Form + Modal | 🟡 Trung |

**Template**:
```jsx
import { Form, Input, Select, DatePicker, Modal, Button } from 'antd';

export function EmployeeModal({ open, onClose, onSubmit }) {
  const [form] = Form.useForm();
  
  return (
    <Modal open={open} onCancel={onClose} title="Add Employee">
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        {/* More fields */}
        <Form.Item>
          <Button htmlType="submit">Submit</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

### 3.3 Table Components (ProTable)
| Component | Cứu | Mới | Độ ưu tiên |
|-----------|----|----|-----------|
| ProjectsList | Custom Table | ProTable | 🔴 Cao |
| Employees | Custom Table | ProTable | 🔴 Cao |
| Worklogs | Custom Table | ProTable | 🔴 Cao |
| ActionLog | Custom Table | ProTable | 🔴 Cao |
| ProjectTasks | Custom Table | ProTable | 🟡 Trung |

**Template ProTable**:
```jsx
import { ProTable } from '@ant-design/pro-components';

export function ProjectsList() {
  const columns = [
    {
      dataIndex: 'name',
      title: 'Project Name',
      search: true,
      sorter: true,
    },
    {
      dataIndex: 'status',
      title: 'Status',
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Completed', value: 'completed' },
      ],
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button>Edit</Button>
          <Button danger>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <ProTable
      columns={columns}
      dataSource={projects}
      search={{ labelWidth: 'auto' }}
      options={{ reload: true, density: true, fullScreen: true }}
      pagination={{ pageSize: 10 }}
      rowKey="id"
    />
  );
}
```

### 3.4 Card & Dashboard Components
| Component | Cũ | Mới | Độ ưu tiên |
|-----------|----|----|-----------|
| TaskCard | Tailwind Card | Ant Card | 🟡 Trung |
| ProjectDashboard | Tailwind | ProCard + Stats | 🟡 Trung |
| OnlineUsers | Custom | Ant List + Avatar | 🟢 Thấp |

---

## 🔄 Giai Đoạn 4: Pages Refactor (5-7 ngày)

### 4.1 Ưu Tiên Cao (🔴)
1. **Projects.jsx** → ProTable + Modal forms
2. **Employees.jsx** → ProTable + Employee modal
3. **Worklogs.jsx** → ProTable + Worklog modal
4. **ActionLog.jsx** → ProTable với pagination + filters

### 4.2 Ưu Tiên Trung (🟡)
5. **Home.jsx** → Ant Card + Statistic
6. **KanbanBoard.jsx** → Giữ nguyên hoặc refactor với Ant Card
7. **ThemeTest.jsx** → Loại bỏ nếu không cần

### 4.3 Ưu Tiên Thấp (🟢)
8. **Login.jsx** → Ant Form (nếu chưa)
9. **Register.jsx** → Ant Form (nếu chưa)
10. **Logout.jsx** → Button + Menu item

---

## 🛠️ Giai Đoạn 5: Utilities & Hooks (2-3 ngày)

### 5.1 Cập Nhật API Services
- Giữ `apiHandler.js` - không thay đổi logic
- Thêm notification handler bằng `message` từ Ant Design

### 5.2 Tạo Custom Hooks cho Ant Design
**File mới**: `frontend/src/hooks/useAntMessage.ts`
```typescript
import { message as antMessage } from 'antd';

export function useAntMessage() {
  return {
    success: (msg) => antMessage.success(msg),
    error: (msg) => antMessage.error(msg),
    loading: (msg) => antMessage.loading(msg),
    warning: (msg) => antMessage.warning(msg),
  };
}
```

### 5.3 Cập Nhật Socket Integration
- Giữ `useSocket.js` logic
- Cập nhật notification bằng Ant Design `notification`

---

## 📈 Giai Đoạn 6: Optimization & Testing (2-3 ngày)

### 6.1 Performance
- Tree-shake unused Ant Design components
- Lazy load Pro Components nếu cần
- Optimize bundle size

### 6.2 Testing
- Unit test components mới
- Integration test forms
- E2E test workflows

### 6.3 Responsive Design
- Test trên mobile/tablet
- Adjust Pro Components responsive props
- Kiểm tra dark mode trên all pages

---

## 📝 File Structure Sau Refactor

```
frontend/src/
├── components/
│   ├── Layout/
│   │   ├── Header.jsx (Ant Layout + Menu)
│   │   ├── Sider.jsx (Ant Menu)
│   │   └── Footer.jsx
│   ├── Forms/
│   │   ├── EmployeeForm.jsx (Ant Form)
│   │   ├── ProjectForm.jsx
│   │   ├── TaskForm.jsx
│   │   └── WorklogForm.jsx
│   ├── Tables/
│   │   ├── ProjectsTable.jsx (ProTable)
│   │   ├── EmployeesTable.jsx
│   │   ├── WorklogsTable.jsx
│   │   └── ActionLogTable.jsx
│   └── Modals/ (Ant Modal)
├── pages/
│   ├── Projects.jsx (ProTable + Modal)
│   ├── Employees.jsx
│   ├── Worklogs.jsx
│   ├── ActionLog.jsx
│   ├── Home.jsx
│   └── ...
├── theme/
│   ├── themeConfig.ts (Ant Design tokens)
│   └── darkTheme.ts
├── hooks/
│   ├── useAntMessage.ts
│   ├── useAntTheme.ts
│   └── ...
├── context/
│   ├── ThemeContext.tsx (Updated for Ant Design)
│   └── ...
└── services/
    └── (Giữ nguyên)
```

---

## 🚀 Quick Start Refactoring Checklist

### Phase 1 (Setup)
- [ ] Install Ant Design + Pro Components
- [ ] Setup theme config files
- [ ] Update ThemeContext for Ant Design
- [ ] Remove Tailwind classes từ index.css

### Phase 2 (Layout)
- [ ] Refactor Header component
- [ ] Refactor Sidebar/Layout
- [ ] Refactor Footer
- [ ] Test responsive design

### Phase 3 (Tables)
- [ ] Projects table → ProTable
- [ ] Employees table → ProTable
- [ ] Worklogs table → ProTable
- [ ] ActionLog table → ProTable

### Phase 4 (Forms)
- [ ] Employee modal → Ant Form
- [ ] Project modal → Ant Form
- [ ] Task modal → Ant Form
- [ ] Worklog modal → Ant Form

### Phase 5 (Pages)
- [ ] Update Projects page
- [ ] Update Employees page
- [ ] Update Worklogs page
- [ ] Update ActionLog page
- [ ] Update Home page (Statistic cards)

### Phase 6 (Polish)
- [ ] Dark/Light mode testing
- [ ] Mobile responsiveness
- [ ] Notification/Message handling
- [ ] Performance optimization

---

## 💡 Best Practices

1. **Theme Consistency**: Sử dụng Ant Design tokens thay vì hardcode colors
2. **Component Reusability**: Tạo reusable ProTable templates
3. **Form Validation**: Leverage Ant Form validation rules
4. **Accessibility**: Sử dụng semantic HTML từ Ant Design
5. **Dark Mode**: Setup ConfigProvider với theme switching
6. **TypeScript**: Migrate .jsx → .tsx từ từ

---

## ⚠️ Lưu Ý Quan Trọng

1. **Breaking Changes**: 
   - Tailwind utility classes sẽ không còn tác dụng
   - Cần update tất cả component styling

2. **Bundle Size**:
   - Ant Design + Pro Components sẽ tăng bundle (~500KB)
   - Tree-shake không cần components

3. **Migration Strategy**:
   - Refactor từng page một
   - Giữ theme system và routing không đổi
   - Test thoroughly trước merge

4. **Browser Support**:
   - Ant Design 5 hỗ trợ IE không tốt
   - Tập trung vào modern browsers

---

## 📚 Resources

- [Ant Design Docs](https://ant.design/)
- [Pro Components](https://pro.ant.design/)
- [ProTable Guide](https://procomponents.ant.design/components/table)
- [Theme Tokens](https://ant.design/docs/react/customize-theme-v5)

---

## 👤 Người Phụ Trách & Timeline

| Giai Đoạn | Thời Gian | Nhiệm Vụ |
|-----------|----------|---------|
| 1. Setup | 1-2 ngày | Cài dependencies, cấu hình theme |
| 2. Theme | 2-3 ngày | Cập nhật theme system |
| 3. Components | 7-10 ngày | Refactor components |
| 4. Pages | 5-7 ngày | Refactor pages |
| 5. Utilities | 2-3 ngày | Cập nhật hooks, services |
| 6. Testing | 2-3 ngày | Test & optimization |
| **Total** | **~3-4 tuần** | |

---

## 📞 Questions & Support

Nếu gặp vấn đề trong quá trình refactoring:
1. Kiểm tra Ant Design documentation
2. Tham khảo Pro Components examples
3. Test thoroughly trước deploy
