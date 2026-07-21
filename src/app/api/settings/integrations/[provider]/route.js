import { NextResponse } from "next/server";
import { getIntegrationConfig, saveIntegrationConfig } from "@/lib/supabase/integrations";

const VALID_PROVIDERS = ["chatbase", "elevenlabs"];

export async function GET(request, { params }) {
  const { provider } = await params;
  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
  }
  return NextResponse.json({ config: await getIntegrationConfig(provider) });
}

export async function PUT(request, { params }) {
  const { provider } = await params;
  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
  }
  const body = await request.json();
  const result = await saveIntegrationConfig(provider, body);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
