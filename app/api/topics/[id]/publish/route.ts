import { NextRequest } from "next/server";
import { handleAdminMutation } from "@/lib/admin/http";
export async function PATCH(req:NextRequest,{params}:{params:{id:string;}}) {
  return handleAdminMutation(req,"set_published",{topicId:params.id});
}
