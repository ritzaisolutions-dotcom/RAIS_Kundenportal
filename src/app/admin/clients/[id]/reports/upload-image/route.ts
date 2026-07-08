import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function sanitizeFilename(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const portal = admin.schema("portal");
  const { data: adminRow } = await portal.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "Bitte eine Bilddatei auswählen." }, { status: 400 });
  }

  const imagePath = `${id}/${Date.now()}-${sanitizeFilename(image.name)}`;
  const { error } = await admin.storage.from("report-images").upload(imagePath, image, {
    contentType: image.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: "Bild konnte nicht hochgeladen werden." }, { status: 500 });
  }

  return NextResponse.json({
    path: imagePath,
    markdown: `![Bild](storage:${imagePath})`,
  });
}
