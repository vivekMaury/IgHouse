import { POST as subscribeInstagram } from "@/app/api/instagram/subscribe/route";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return subscribeInstagram(request);
}
