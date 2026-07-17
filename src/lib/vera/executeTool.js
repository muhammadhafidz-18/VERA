// src/lib/vera/executeTool.js
import { getMeetings, createMeeting } from "@/lib/supabase/meetings";
import { createTask } from "@/lib/supabase/tasks";
import {
  getEmployees,
  createEmployee,
  addDivision,
  addBranch,
} from "@/lib/supabase/directory";

export async function executeVeraTool(name, input) {
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

  if (name === "get_meetings") {
    const results = await getMeetings(input);
    return {
      total_matches: results.length,
      results: results.slice(0, 25).map((m) => ({ id: m.id, title: m.title, date: m.date, time: m.time, location: m.location })),
    };
  }

  if (name === "create_meeting") {
    if (!input.title || !input.date || !input.time) {
      return { success: false, error: "Missing required fields (title, date, time)." };
    }
    return await createMeeting(input);
  }

  if (name === "create_task") {
    if (!input.title || !input.assignedTo) {
      return { success: false, error: "Missing required fields (title, assignedTo)." };
    }
    return await createTask(input);
  }

  if (name === "add_division") {
    if (!input.name?.trim()) return { success: false, error: "Division name is required." };
    return await addDivision(input.name.trim());
  }

  if (name === "add_branch") {
    if (!input.name?.trim()) return { success: false, error: "Branch name is required." };
    return await addBranch(input.name.trim());
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
