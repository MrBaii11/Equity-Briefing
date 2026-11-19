import { NextRequest } from "next/server";
import { searchCompanies } from "@/lib/data/resolve";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const results = await searchCompanies(q);
  return Response.json({ results });
}
