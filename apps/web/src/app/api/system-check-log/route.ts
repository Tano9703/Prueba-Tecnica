import { NextRequest, NextResponse } from "next/server";

type Status = "ok" | "error" | "pending";

type LoggedCheck = {
  key: string;
  label: string;
  status: Status;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { checks?: LoggedCheck[] } | null;
  const checks = Array.isArray(body?.checks) ? body!.checks : [];

  const stamp = new Date().toISOString();
  console.log(`[Front System Checklist] ${stamp}`);
  for (const check of checks) {
    const icon = check.status === "ok" ? "✓" : check.status === "error" ? "✗" : "...";
    console.log(` - ${icon} ${check.label} (${check.key})`);
  }

  return NextResponse.json({ ok: true });
}
