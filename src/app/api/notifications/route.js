import { NextResponse } from "next/server";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/vera/store";

export async function GET() {
  return NextResponse.json({ notifications: getNotifications() });
}
export async function PUT(request) {
  const body = await request.json().catch(() => ({}));
  if (body.id) return NextResponse.json({ notifications: markNotificationRead(body.id) });
  return NextResponse.json({ notifications: markAllNotificationsRead() });
}
