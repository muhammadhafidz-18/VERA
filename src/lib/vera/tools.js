// src/lib/vera/tools.js

export const VERA_TOOLS = [
  {
    name: "get_employees",
    description: "Search or list employees from the company's Employee Directory. Use this whenever the user asks about who works where, employee details, headcount, or lists of employees.",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Optional keyword to match against employee name, ID, or email" },
        division: { type: "string", description: "Optional division name to filter by" },
        branch: { type: "string", description: "Optional branch/city to filter by" },
      },
    },
  },
  {
    name: "create_employee",
    description: "Create a new employee record in the Employee Directory. Only call this after confirming name, email, division, and branch with the user — ask for any missing details first rather than guessing.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        division: { type: "string" },
        branch: { type: "string" },
        role: { type: "string", enum: ["Superadmin", "User"] },
        joinDate: { type: "string", description: "Format YYYY-MM-DD" },
      },
      required: ["name", "email", "division", "branch"],
    },
  },
  {
    name: "get_meetings",
    description: "Search or list meetings from the Meeting Schedule. Use this to check for scheduling conflicts before creating a meeting, or to answer questions about upcoming/existing meetings.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Optional exact date to filter by, format YYYY-MM-DD" },
        search: { type: "string", description: "Optional keyword to match against meeting title or location" },
      },
    },
  },
  {
    name: "create_meeting",
    description: "Create a new meeting in the Meeting Schedule. Required: title, date, time. If the user hasn't given date/time/who it's with/what it's about, ask for the missing pieces first. Before creating, it's good practice to call get_meetings for the same date to check for a scheduling conflict.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        date: { type: "string", description: "Format YYYY-MM-DD" },
        time: { type: "string", description: "24-hour format HH:MM" },
        location: { type: "string" },
        description: { type: "string" },
        attendeeNames: { type: "array", items: { type: "string" }, description: "Names of employees to invite" },
      },
      required: ["title", "date", "time"],
    },
  },
  {
    name: "create_task",
    description: "Create and assign a new task/request to an employee. Required: title, assignedTo. If the user only gave a name, use get_employees first to resolve the correct employee ID.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        assignedTo: { type: "string", description: "Employee ID to assign the task to, e.g. EMP-0003" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        dueDate: { type: "string", description: "Format YYYY-MM-DD" },
      },
      required: ["title", "assignedTo"],
    },
  },
  {
    name: "add_division",
    description: "Add a new division to the company's list of divisions. Only call after confirming the exact division name with the user.",
    input_schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
  },
  {
    name: "add_branch",
    description: "Add a new branch/city to the company's list of branches. Only call after confirming the exact branch name with the user.",
    input_schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
  },
  {
    name: "logout",
    description: "Sign the current user out of the app, ending their session. This is destructive/disruptive — only call it after the user has clearly and explicitly confirmed they want to log out in THIS conversation.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "reset_conversation",
    description: "Clear the current chat history in Ask V.E.R.A and start a fresh conversation. This cannot be undone — only call it after the user has clearly confirmed they want to reset/clear the conversation.",
    input_schema: { type: "object", properties: {} },
  },
];
