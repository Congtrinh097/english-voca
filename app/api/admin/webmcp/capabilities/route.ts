import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { webmcpMode } from "@/lib/admin/mode";
export const dynamic = "force-dynamic";
export async function GET() {
  const {error} = await requireAdmin();
  if(error) return error;
  return NextResponse.json({role:"admin",mode:webmcpMode()},{headers:{"Cache-Control":"no-store"}});
}
