import { handleMcpRequest } from "@/lib/mcp/protocol";

export const dynamic = "force-dynamic";

export async function POST(request: Request) { return handleMcpRequest(request); }
export async function OPTIONS(request: Request) { return handleMcpRequest(request); }
