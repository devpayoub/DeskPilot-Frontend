import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { MeResponse } from "@/lib/api/types";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: { code: "not_authenticated", message: "Not signed in.", details: null, request_id: "" } },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${env.apiBaseUrl}/api/v1/auth/me/`, {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  }

  const me = (await upstream.json()) as MeResponse;
  return NextResponse.json(me);
}
