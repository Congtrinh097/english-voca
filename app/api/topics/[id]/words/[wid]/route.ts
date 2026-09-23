import { NextRequest } from "next/server";
import { handleAdminMutation } from "@/lib/admin/http";
export async function PUT(req:NextRequest,{params}:{params:{id:string;wid:string;}}) {
  return handleAdminMutation(req,"update_word",{topicId:params.id,wordId:params.wid});
}
export async function DELETE(req:NextRequest,{params}:{params:{id:string;wid:string;}}) {
  return handleAdminMutation(req,"delete_word",{topicId:params.id,wordId:params.wid});
}
