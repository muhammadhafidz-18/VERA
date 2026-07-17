import { NextResponse } from "next/server";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/supabase/notifications";

export async function GET() {
  return NextResponse.json({ notifications: await getNotifications() });
}
export async function PUT(request) {
  const body = await request.json().catch(() => ({}));
  if (body.id) return NextResponse.json({ notifications: await markNotificationRead(body.id) });
  return NextResponse.json({ notifications: await markAllNotificationsRead() });
}
