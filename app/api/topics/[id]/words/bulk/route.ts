import { NextRequest } from "next/server";
import { handleAdminMutation } from "@/lib/admin/http";
export async function POST(req:NextRequest,{params}:{params:{id:string;}}) {
  return handleAdminMutation(req,"import_words",{topicId:params.id});
}
