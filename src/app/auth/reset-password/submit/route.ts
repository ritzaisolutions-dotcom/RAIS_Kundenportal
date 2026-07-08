import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) {
    const url = new URL("/auth/reset-password", request.url);
    url.searchParams.set("error", "Passwort muss mindestens 10 Zeichen haben.");
    return NextResponse.redirect(url);
  }

  const { error } = await supabase.auth.updateUser({
    password,
    data: {
      must_change_password: false,
    },
  });

  if (error) {
    const url = new URL("/auth/reset-password", request.url);
    url.searchParams.set("error", "Passwort konnte nicht gesetzt werden.");
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
