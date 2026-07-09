import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Gleiches Muster wie admin/clients/new/clear-temp-password: loescht den
// Flash-Cookie sofort nach dem einmaligen Anzeigen, statt auf maxAge zu warten.
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("temp_password_flash");
  return NextResponse.json({ ok: true });
}
