// src/lib/vera/executeTool.js
import { getMeetings, createMeeting, updateMeeting } from "@/lib/supabase/meetings";
import { getTasks, createTask, updateTask, changeTaskStatus } from "@/lib/supabase/tasks";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  addDivision,
  addBranch,
  getDivisions,
  renameDivision,
  getBranches,
  renameBranch,
} from "@/lib/supabase/directory";
import { callChatbase } from "@/lib/chatbase";

export async function executeVeraTool(name, input, context = {}) {
  if (name === "get_employees") {
    const results = await getEmployees(input);
    return {
      total_matches: results.length,
      results: results.slice(0, 25).map((e) => ({
        id: e.id, name: e.name, email: e.email, division: e.division, branch: e.branch, role: e.role,
      })),
    };
  }

  if (name === "create_employee") {
    if (!input.name || !input.email || !input.division || !input.branch) {
      return { success: false, error: "Missing required fields (name, email, division, branch)." };
    }
    return await createEmployee(input);
  }

  if (name === "create_meeting") {
    if (!input.title || !input.date || !input.startTime || !input.endTime) {
      return { success: false, error: "Missing required fields (title, date, startTime, endTime)." };
    }
    return await createMeeting(input);
  }

  if (name === "update_meeting") {
    if (!input.id) return { success: false, error: "Meeting ID is required." };
    const { id, ...patch } = input;
    return await updateMeeting(id, patch);
  }


  if (name === "create_task") {
    if (!input.title || !input.assignedTo) {
      return { success: false, error: "Missing required fields (title, assignedTo)." };
    }
    return await createTask(input);
  }

  if (name === "update_employee") {
    if (!input.id) return { success: false, error: "Employee ID is required." };
    const { id, ...patch } = input;
    return await updateEmployee(id, patch);
  }

  if (name === "get_tasks") {
    const results = await getTasks();
    return {
      total_matches: results.length,
      results: results.slice(0, 25).map((t) => ({
        id: t.id, title: t.title, assignedTo: t.assignedTo, createdBy: t.createdBy, status: t.status, priority: t.priority, dueDate: t.dueDate,
      })),
    };
  }

  if (name === "update_task") {
    if (!input.id) return { success: false, error: "Task ID is required." };
    const { id, status, ...patch } = input;
    if (status) return await changeTaskStatus(id, status);
    return await updateTask(id, patch);
  }

  if (name === "get_divisions") {
    const divisions = await getDivisions();
    return { total: divisions.length, divisions };
  }

  if (name === "update_division") {
    if (!input.oldName?.trim() || !input.newName?.trim()) {
      return { success: false, error: "Both oldName and newName are required." };
    }
    return await renameDivision(input.oldName.trim(), input.newName.trim());
  }

  if (name === "get_branches") {
    const branches = await getBranches();
    return { total: branches.length, branches };
  }

  if (name === "update_branch") {
    if (!input.oldName?.trim() || !input.newName?.trim()) {
      return { success: false, error: "Both oldName and newName are required." };
    }
    return await renameBranch(input.oldName.trim(), input.newName.trim());
  }

  if (name === "add_division") {
    if (!input.name?.trim()) return { success: false, error: "Division name is required." };
    return await addDivision(input.name.trim());
  }

  if (name === "add_branch") {
    if (!input.name?.trim()) return { success: false, error: "Branch name is required." };
    return await addBranch(input.name.trim());
  }

  if (name === "search_product_knowledge") {
    const { chatbaseConfig } = context;
    if (!chatbaseConfig?.enabled || !chatbaseConfig?.apiKey || !chatbaseConfig?.chatbotId) {
      return {
        success: false,
        error: "Product knowledge search isn't set up yet. An admin needs to configure Chatbase in Settings first.",
      };
    }
    try {
      const answer = await callChatbase(input.question, chatbaseConfig.apiKey, chatbaseConfig.chatbotId);
      return { success: true, answer: answer || "No answer found in the product knowledge base." };
    } catch (err) {
      return { success: false, error: "Couldn't reach the product knowledge base right now. Try again shortly." };
    }
  }

  if (name === "export_employees") {
    const results = await getEmployees(input);
    const params = new URLSearchParams();
    if (input.division) params.set("division", input.division);
    if (input.branch) params.set("branch", input.branch);
    if (input.search) params.set("search", input.search);
    const qs = params.toString();
    return {
      success: true,
      count: results.length,
      downloadUrl: `/api/employees/export${qs ? `?${qs}` : ""}`,
    };
  }

  if (name === "logout") {
    // Actual sign-out happens client-side after this response comes back —
    // see the `logoutRequested` flag in the API route.
    return { success: true, message: "Logout will proceed after this message." };
  }

  if (name === "reset_conversation") {
    // Actual chat-history clearing happens client-side — see `resetRequested`.
    return { success: true, message: "Conversation will be reset after this message." };
  }

  return { success: false, error: `Unknown tool: ${name}` };
}
