// src/lib/vera/store.js
//
// In-memory data store, ported 1:1 (same seed data + logic) from the HTML
// prototype's SEED_EMPLOYEES / SEED_MEETINGS / SEED_TASKS. This only
// persists for the life of the `next dev` process — resets on restart, and
// won't work on serverless production (Vercel spins up fresh instances per
// request). Swap every function here for real Supabase queries once ready
// (see `vera_schema.sql`) — that's Fase 4 in the migration roadmap.

export let employees = [
  { id: "EMP-0001", name: "Vaulthos", email: "vaulthos@vaulthos.com", role: "Superadmin", birthDate: "1990-01-14", branch: "Jakarta", division: "Engineering", joinDate: "2022-01-10", phone: "081234560001", identityNumber: "3171010101900001", address: "Jl. Kemang Raya No. 12, Jakarta Selatan" },
  { id: "EMP-0002", name: "Sarah Wijaya", email: "sarah@vaulthos.com", role: "User", birthDate: "1994-06-10", branch: "Jakarta", division: "Human Resources", joinDate: "2021-03-22", phone: "081234560002", identityNumber: "3171010101900002", address: "Jl. Sudirman No. 45, Jakarta Pusat" },
  { id: "EMP-0003", name: "Andi Kurniawan", email: "andi@vaulthos.com", role: "User", birthDate: "1972-11-02", branch: "Surabaya", division: "Finance", joinDate: "2020-07-15", phone: "081234560003", identityNumber: "3171010101900003", address: "Jl. Darmo No. 8, Surabaya" },
  { id: "EMP-0004", name: "Rina Melati", email: "rina@vaulthos.com", role: "User", birthDate: "1999-09-23", branch: "Bandung", division: "Marketing", joinDate: "2023-02-01", phone: "081234560004", identityNumber: "3171010101900004", address: "Jl. Dago No. 21, Bandung" },
  { id: "EMP-0005", name: "Budi Santoso", email: "budi@vaulthos.com", role: "User", birthDate: "1965-04-18", branch: "Jakarta", division: "Operations", joinDate: "2019-11-05", phone: "081234560005", identityNumber: "3171010101900005", address: "Jl. Gatot Subroto No. 3, Jakarta" },
  { id: "EMP-0006", name: "Citra Dewi", email: "citra@vaulthos.com", role: "User", birthDate: "1988-12-05", branch: "Medan", division: "Legal", joinDate: "2022-09-18", phone: "081234560006", identityNumber: "3171010101900006", address: "Jl. Gatot Subroto No. 88, Medan" },
  { id: "EMP-0007", name: "Fajar Nugroho", email: "fajar@vaulthos.com", role: "User", birthDate: "2008-02-15", branch: "Jakarta", division: "Sales", joinDate: "2021-05-30", phone: "081234560007", identityNumber: "3171010101900007", address: "Jl. Rasuna Said No. 9, Jakarta" },
  { id: "EMP-0008", name: "Gita Puspita", email: "gita@vaulthos.com", role: "User", birthDate: "1996-08-30", branch: "Surabaya", division: "Engineering", joinDate: "2020-12-12", phone: "081234560008", identityNumber: "3171010101900008", address: "Jl. Basuki Rahmat No. 5, Surabaya" },
  { id: "EMP-0009", name: "Hendra Saputra", email: "hendra@vaulthos.com", role: "User", birthDate: "1979-01-09", branch: "Bandung", division: "Human Resources", joinDate: "2023-06-01", phone: "081234560009", identityNumber: "3171010101900009", address: "Jl. Braga No. 14, Bandung" },
  { id: "EMP-0010", name: "Indah Permatasari", email: "indah@vaulthos.com", role: "User", birthDate: "1969-10-11", branch: "Jakarta", division: "Finance", joinDate: "2019-08-20", phone: "081234560010", identityNumber: "3171010101900010", address: "Jl. Thamrin No. 1, Jakarta" },
  { id: "EMP-0011", name: "Joko Widianto", email: "joko@vaulthos.com", role: "User", birthDate: "1991-03-27", branch: "Medan", division: "Marketing", joinDate: "2022-04-14", phone: "081234560011", identityNumber: "3171010101900011", address: "Jl. Diponegoro No. 6, Medan" },
  { id: "EMP-0012", name: "Kiki Amelia", email: "kiki@vaulthos.com", role: "User", birthDate: "2007-05-06", branch: "Jakarta", division: "Operations", joinDate: "2021-10-09", phone: "081234560012", identityNumber: "3171010101900012", address: "Jl. Kuningan No. 2, Jakarta" },
  { id: "EMP-0013", name: "Lukman Hakim", email: "lukman@vaulthos.com", role: "User", birthDate: "1982-02-14", branch: "Surabaya", division: "Legal", joinDate: "2020-02-27", phone: "081234560013", identityNumber: "3171010101900013", address: "Jl. Pemuda No. 19, Surabaya" },
  { id: "EMP-0014", name: "Maya Sari", email: "maya@vaulthos.com", role: "User", birthDate: "1998-07-01", branch: "Bandung", division: "Sales", joinDate: "2023-01-16", phone: "081234560014", identityNumber: "3171010101900014", address: "Jl. Asia Afrika No. 33, Bandung" },
  { id: "EMP-0015", name: "Nanda Prasetyo", email: "nanda@vaulthos.com", role: "User", birthDate: "1993-12-25", branch: "Jakarta", division: "Engineering", joinDate: "2022-07-07", phone: "081234560015", identityNumber: "3171010101900015", address: "Jl. Casablanca No. 7, Jakarta" },
];

export let meetings = [
  { id: "MTG-02", title: "Review Q3 Roadmap", date: "2026-07-22", startTime: "10:00", endTime: "11:00", location: "Meeting Room A", description: "Review Q3 roadmap progress and Q4 priorities.", attendeeIds: ["EMP-0003", "EMP-0005"] },
  { id: "MTG-03", title: "New employee onboarding", date: "2026-07-16", startTime: "10:00", endTime: "11:00", location: "Zoom", description: "Introduction session for newly joined employees.", attendeeIds: [] },
  { id: "MTG-04", title: "1:1 with manager", date: "2026-07-25", startTime: "10:00", endTime: "11:00", location: "Meeting Room B", description: "Discuss this month's work progress.", attendeeIds: [] },
  { id: "MTG-05", title: "All Hands Meeting", date: "2026-07-28", startTime: "10:00", endTime: "11:00", location: "Auditorium", description: "Company update for all employees.", attendeeIds: [] },
];

export let tasks = [
  {
    id: "TSK-0001", title: "Broken laptop",
    description: "Laptop screen has been streaky since yesterday, uncomfortable to use for work.",
    createdBy: "EMP-0001", assignedTo: "EMP-0008", status: "open", priority: "high",
    dueDate: Date.now() + 1000 * 60 * 60 * 24 * 1.5,
    aiSummary: null, aiSummaryGeneratedAt: null, aiIssueAnalysis: null, aiIssueAnalysisGeneratedAt: null,
    aiSummaryGenerateCount: 0, aiIssueAnalysisGenerateCount: 0,
    auditLog: [{ id: 1, action: "created", byUserId: "EMP-0001", detail: "Task created", createdAt: Date.now() - 1000 * 60 * 50 }],
    chats: [
      { id: 1, senderId: "EMP-0001", message: "Hi, laptop screen saya bergaris sejak kemarin, susah dipakai kerja.", attachment: null, isSystem: false, createdAt: Date.now() - 1000 * 60 * 45 },
      { id: 2, senderId: "EMP-0008", message: "Baik, saya cek dulu ya, kemungkinan kabel fleksibel LCD-nya longgar.", attachment: null, isSystem: false, createdAt: Date.now() - 1000 * 60 * 30 },
    ],
  },
  {
    id: "TSK-0002", title: "Reimbursement calculation error",
    description: "June reimbursement amount does not match what was submitted.",
    createdBy: "EMP-0001", assignedTo: "EMP-0003", status: "in_progress", priority: "medium",
    dueDate: Date.now() + 1000 * 60 * 60 * 24 * 3,
    aiSummary: null, aiSummaryGeneratedAt: null, aiIssueAnalysis: null, aiIssueAnalysisGeneratedAt: null,
    aiSummaryGenerateCount: 0, aiIssueAnalysisGenerateCount: 0,
    auditLog: [{ id: 1, action: "created", byUserId: "EMP-0001", detail: "Task created", createdAt: Date.now() - 1000 * 60 * 60 * 5 }],
    chats: [
      { id: 1, senderId: "EMP-0001", message: "Jumlah reimbursement bulan Juni saya tidak sesuai dengan yang saya submit.", attachment: null, isSystem: false, createdAt: Date.now() - 1000 * 60 * 60 * 4 },
      { id: 2, senderId: "EMP-0003", message: "Baik, saya cek dulu di sistem, sepertinya ada selisih di kategori transportasi.", attachment: null, isSystem: false, createdAt: Date.now() - 1000 * 60 * 60 * 2 },
    ],
  },
  {
    id: "TSK-0003", title: "Additional leave request",
    description: "Requesting additional leave for family matters.",
    createdBy: "EMP-0001", assignedTo: "EMP-0002", status: "done", priority: "low",
    dueDate: null,
    aiSummary: null, aiSummaryGeneratedAt: null, aiIssueAnalysis: null, aiIssueAnalysisGeneratedAt: null,
    aiSummaryGenerateCount: 0, aiIssueAnalysisGenerateCount: 0,
    auditLog: [
      { id: 1, action: "created", byUserId: "EMP-0001", detail: "Task created", createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2 },
      { id: 2, action: "status_changed", byUserId: "EMP-0002", detail: 'Status changed from "Open" to "Done"', createdAt: Date.now() - 1000 * 60 * 60 * 20 },
    ],
    chats: [
      { id: 1, senderId: "EMP-0001", message: "Mengajukan cuti tambahan untuk keperluan keluarga.", attachment: null, isSystem: false, createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2 },
      { id: 2, senderId: "EMP-0002", message: "Sudah disetujui, silakan cek email untuk konfirmasinya.", attachment: null, isSystem: false, createdAt: Date.now() - 1000 * 60 * 60 * 21 },
      { id: 3, senderId: null, message: 'Moved to "Done" by Sarah Wijaya', attachment: null, isSystem: true, action: "status_changed", createdAt: Date.now() - 1000 * 60 * 60 * 20 },
    ],
  },
];

export let notifications = [];

export const CURRENT_USER_ID = "EMP-0001";
export const EMPLOYEES = employees; // exposed raw for the (temporary) client-side login validation

export let divisions = ["Engineering", "Human Resources", "Finance", "Marketing", "Operations", "Legal", "Sales"];
export let branches = ["Jakarta", "Surabaya", "Bandung", "Medan"];

function generateEmployeeId() {
  const nums = employees.map((e) => parseInt(e.id.replace(/[^0-9]/g, ""), 10)).filter((n) => !isNaN(n));
  return `EMP-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0")}`;
}
function generateMeetingId() {
  const nums = meetings.map((m) => parseInt(m.id.replace(/[^0-9]/g, ""), 10)).filter((n) => !isNaN(n));
  return `MTG-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, "0")}`;
}
function generateTaskId() {
  const nums = tasks.map((t) => parseInt(t.id.replace(/[^0-9]/g, ""), 10)).filter((n) => !isNaN(n));
  return `TSK-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0")}`;
}

export function taskUserById(id) {
  return employees.find((e) => e.id === id) || { id, name: "Unknown", division: "-" };
}

// ---------- Employees ----------
export function getEmployees({ search, division, branch } = {}) {
  const q = (search || "").toLowerCase();
  return employees.filter((e) => {
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
    const matchDivision = !division || e.division.toLowerCase() === division.toLowerCase();
    const matchBranch = !branch || e.branch.toLowerCase() === branch.toLowerCase();
    return matchSearch && matchDivision && matchBranch;
  });
}

export function createEmployee(input) {
  if (employees.some((e) => e.email.toLowerCase() === input.email.toLowerCase())) {
    return { success: false, error: `An employee with email ${input.email} already exists.` };
  }
  const newEmployee = {
    id: input.id || generateEmployeeId(),
    name: input.name,
    email: input.email,
    role: input.role || "User",
    birthDate: input.birthDate || "",
    division: input.division,
    branch: input.branch,
    joinDate: input.joinDate || new Date().toISOString().slice(0, 10),
    phone: input.phone || "",
    identityNumber: input.identityNumber || "",
    address: input.address || "",
  };
  employees.push(newEmployee);
  return { success: true, employee: newEmployee };
}

export function updateEmployee(id, patch) {
  const idx = employees.findIndex((e) => e.id === id);
  if (idx === -1) return { success: false, error: `No employee found with ID ${id}.` };
  employees[idx] = { ...employees[idx], ...patch };
  return { success: true, employee: employees[idx] };
}

export function deleteEmployee(id) {
  const before = employees.length;
  employees = employees.filter((e) => e.id !== id);
  return { success: employees.length < before };
}

// ---------- Meetings ----------
export function getMeetings({ date, search } = {}) {
  const q = (search || "").toLowerCase();
  return meetings.filter((m) => {
    const matchDate = !date || m.date === date;
    const matchSearch = !q || m.title.toLowerCase().includes(q) || (m.location || "").toLowerCase().includes(q);
    return matchDate && matchSearch;
  });
}

export function createMeeting(input) {
  const conflicts = meetings.filter((m) => m.date === input.date && m.time === input.time);
  let attendeeIds = input.attendeeIds || [];
  if (!attendeeIds.length && input.attendeeNames) {
    attendeeIds = input.attendeeNames
      .map((n) => employees.find((e) => e.name.toLowerCase().includes(n.toLowerCase())))
      .filter(Boolean)
      .map((e) => e.id);
  }
  const newMeeting = {
    id: generateMeetingId(),
    title: input.title,
    date: input.date,
    time: input.time,
    location: input.location || "",
    description: input.description || "",
    attendeeIds,
  };
  meetings.push(newMeeting);
  return {
    success: true,
    meeting: newMeeting,
    schedule_conflict: conflicts.length > 0,
    conflicting_meetings: conflicts.map((m) => ({ title: m.title, time: m.time, location: m.location })),
  };
}

export function updateMeeting(id, patch) {
  const idx = meetings.findIndex((m) => m.id === id);
  if (idx === -1) return { success: false, error: `No meeting found with ID ${id}.` };
  meetings[idx] = { ...meetings[idx], ...patch };
  return { success: true, meeting: meetings[idx] };
}

export function deleteMeeting(id) {
  const before = meetings.length;
  meetings = meetings.filter((m) => m.id !== id);
  return { success: meetings.length < before };
}

// ---------- Tasks ----------
export function getTasks() {
  return tasks;
}

export function getTaskById(id) {
  return tasks.find((t) => t.id === id) || null;
}

export function createTask(input) {
  const assignee = employees.find((e) => e.id === input.assignedTo);
  if (!assignee) {
    return { success: false, error: `No employee found with ID ${input.assignedTo}.` };
  }
  const newTask = {
    id: generateTaskId(),
    title: input.title,
    description: input.description || "",
    createdBy: CURRENT_USER_ID,
    assignedTo: input.assignedTo,
    status: "open",
    priority: input.priority || "medium",
    dueDate: input.dueDate ? new Date(input.dueDate).getTime() : null,
    aiSummary: null, aiSummaryGeneratedAt: null, aiIssueAnalysis: null, aiIssueAnalysisGeneratedAt: null,
    aiSummaryGenerateCount: 0, aiIssueAnalysisGenerateCount: 0,
    auditLog: [{ id: Date.now(), action: "created", byUserId: CURRENT_USER_ID, detail: "Task created", createdAt: Date.now() }],
    chats: [],
  };
  tasks.push(newTask);
  pushNotification(newTask.id, `Task "${newTask.title}" created and assigned to ${assignee.name}`);
  return { success: true, task: { id: newTask.id, title: newTask.title, assignedTo: assignee.name, priority: newTask.priority, dueDate: input.dueDate || null } };
}

export function updateTask(id, patch) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return { success: false, error: `No task found with ID ${id}.` };
  tasks[idx] = { ...tasks[idx], ...patch };
  return { success: true, task: tasks[idx] };
}

export function deleteTask(id) {
  const before = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  notifications = notifications.filter((n) => n.taskId !== id);
  return { success: tasks.length < before };
}

export function pushTaskAudit(taskId, action, detail, byUserId = CURRENT_USER_ID) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.auditLog = [{ id: Date.now() + Math.random(), action, byUserId, detail, createdAt: Date.now() }, ...(task.auditLog || [])];
}

export function pushTaskSystemChat(taskId, action, detail) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.chats = [...task.chats, { id: Date.now() + Math.random(), senderId: null, message: detail, attachment: null, isSystem: true, action, createdAt: Date.now() }];
}

export function addTaskChat(taskId, senderId, message, attachment) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return { success: false, error: "Task not found." };
  const chat = { id: Date.now() + Math.random(), senderId, message, attachment: attachment || null, isSystem: false, createdAt: Date.now() };
  task.chats = [...task.chats, chat];
  pushNotification(taskId, `New message on "${task.title}"`);
  return { success: true, chat };
}

export function changeTaskStatus(taskId, newStatus) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return { success: false, error: "Task not found." };
  if (task.status === newStatus) return { success: true, task };
  const oldLabel = task.status;
  task.status = newStatus;
  pushTaskAudit(taskId, "status_changed", `Status changed from "${oldLabel}" to "${newStatus}"`);
  pushTaskSystemChat(taskId, "status_changed", `Moved to "${newStatus}"`);
  pushNotification(taskId, `Status of "${task.title}" changed to ${newStatus}`);
  return { success: true, task };
}

// ---------- Notifications ----------
export function pushNotification(taskId, message) {
  notifications = [{ id: Date.now() + Math.random(), taskId, message, isRead: false, createdAt: Date.now() }, ...notifications];
}
export function getNotifications() {
  return notifications;
}
export function markAllNotificationsRead() {
  notifications = notifications.map((n) => ({ ...n, isRead: true }));
  return notifications;
}
export function markNotificationRead(id) {
  notifications = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  return notifications;
}

// ---------- Divisions & Branches ----------
export function addDivision(name) {
  if (divisions.some((d) => d.toLowerCase() === name.toLowerCase())) {
    return { success: false, error: `Division "${name}" already exists.` };
  }
  divisions.push(name);
  return { success: true, division: name };
}
export function deleteDivision(name) {
  divisions = divisions.filter((d) => d !== name);
  return { success: true };
}
export function renameDivision(oldName, newName) {
  if (divisions.some((d) => d.toLowerCase() === newName.toLowerCase() && d.toLowerCase() !== oldName.toLowerCase())) {
    return { success: false, error: `Division "${newName}" already exists.` };
  }
  divisions = divisions.map((d) => (d === oldName ? newName : d));
  return { success: true };
}
export function addBranch(name) {
  if (branches.some((b) => b.toLowerCase() === name.toLowerCase())) {
    return { success: false, error: `Branch "${name}" already exists.` };
  }
  branches.push(name);
  return { success: true, branch: name };
}
export function deleteBranch(name) {
  branches = branches.filter((b) => b !== name);
  return { success: true };
}
export function renameBranch(oldName, newName) {
  if (branches.some((b) => b.toLowerCase() === newName.toLowerCase() && b.toLowerCase() !== oldName.toLowerCase())) {
    return { success: false, error: `Branch "${newName}" already exists.` };
  }
  branches = branches.map((b) => (b === oldName ? newName : b));
  return { success: true };
}
export function getDivisions() {
  return divisions;
}
export function getBranches() {
  return branches;
}
