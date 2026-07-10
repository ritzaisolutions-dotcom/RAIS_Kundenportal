/**
 * Legt drei Testkunden mit unterschiedlichen Portal-Berechtigungen an.
 *
 * Ausfuehrung:
 *   cd rais-portal
 *   npm run seed:test-customers
 *
 * Benoetigte env vars (z.B. aus .env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { resolvePortalHome } from "../src/lib/portal-queries";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Fehlende env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

type TestCustomer = {
  slug: string;
  name: string;
  email: string;
  displayName: string;
  canViewReports: boolean;
  canViewInputs: boolean;
};

const TEST_CUSTOMERS: TestCustomer[] = [
  {
    slug: "test-vollzugriff",
    name: "Test Vollzugriff",
    email: "test-vollzugriff@rais.invalid",
    displayName: "Test Vollzugriff",
    canViewReports: true,
    canViewInputs: true,
  },
  {
    slug: "test-nur-reports",
    name: "Test Nur Reports",
    email: "test-nur-reports@rais.invalid",
    displayName: "Test Nur Reports",
    canViewReports: true,
    canViewInputs: false,
  },
  {
    slug: "test-nur-inputs",
    name: "Test Nur Inputs",
    email: "test-nur-inputs@rais.invalid",
    displayName: "Test Nur Inputs",
    canViewReports: false,
    canViewInputs: true,
  },
];

const DEMO_REPORT_TITLE = "Test Status-Report (Berechtigung)";
const DEMO_INPUT_TITLE = "Test Input-Anfrage (Berechtigung)";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function testPassword(slug: string) {
  return `RAIS-test-${slug}`;
}

async function findUserIdByEmail(email: string) {
  let page = 1;
  for (let i = 0; i < 25; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data) break;
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function ensureClient(customer: TestCustomer) {
  const portal = admin.schema("portal");
  const { data: existing } = await portal.from("clients").select("id").eq("slug", customer.slug).maybeSingle();

  if (existing?.id) {
    await portal
      .from("clients")
      .update({
        name: customer.name,
        primary_contact_email: customer.email,
      })
      .eq("id", existing.id);
    return existing.id;
  }

  const { data: created, error } = await portal
    .from("clients")
    .insert({
      name: customer.name,
      slug: customer.slug,
      primary_contact_email: customer.email,
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(`Client ${customer.slug}: ${error?.message ?? "insert failed"}`);
  }

  return created.id;
}

async function ensureAuthUser(customer: TestCustomer) {
  const password = testPassword(customer.slug);
  let userId = await findUserIdByEmail(customer.email);

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: customer.email,
      password,
      email_confirm: true,
      user_metadata: { must_change_password: false },
    });
    if (error || !data.user) {
      throw new Error(`Auth user ${customer.email}: ${error?.message ?? "create failed"}`);
    }
    userId = data.user.id;
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) {
      throw new Error(`Auth user ${customer.email}: ${error.message}`);
    }
  }

  return userId;
}

async function ensureClientUser(customer: TestCustomer, clientId: string, userId: string) {
  const portal = admin.schema("portal");
  const { error } = await portal.from("client_users").upsert(
    {
      user_id: userId,
      client_id: clientId,
      display_name: customer.displayName,
      can_view_reports: customer.canViewReports,
      can_view_inputs: customer.canViewInputs,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`client_users ${customer.slug}: ${error.message}`);
  }
}

async function ensureDemoContent(clientId: string) {
  const portal = admin.schema("portal");

  const { data: existingReport } = await portal
    .from("status_reports")
    .select("id")
    .eq("client_id", clientId)
    .eq("title", DEMO_REPORT_TITLE)
    .maybeSingle();

  if (!existingReport) {
    const { error } = await portal.from("status_reports").insert({
      client_id: clientId,
      title: DEMO_REPORT_TITLE,
      body_md: "Demo-Report zum Testen der Reports-Berechtigung.",
      status: "published",
      published_at: new Date().toISOString(),
    });
    if (error) throw new Error(`status_reports: ${error.message}`);
  }

  const { data: existingInput } = await portal
    .from("input_requests")
    .select("id")
    .eq("client_id", clientId)
    .eq("title", DEMO_INPUT_TITLE)
    .maybeSingle();

  if (!existingInput) {
    const { error } = await portal.from("input_requests").insert({
      client_id: clientId,
      title: DEMO_INPUT_TITLE,
      description_md: "Demo-Anfrage zum Testen der Input-Berechtigung.",
      kind: "freetext",
      status: "open",
    });
    if (error) throw new Error(`input_requests: ${error.message}`);
  }
}

async function main() {
  const summary: Array<{
    name: string;
    email: string;
    password: string;
    landing: string;
    reports: string;
    inputs: string;
  }> = [];

  for (const customer of TEST_CUSTOMERS) {
    const clientId = await ensureClient(customer);
    const userId = await ensureAuthUser(customer);
    await ensureClientUser(customer, clientId, userId);
    await ensureDemoContent(clientId);

    summary.push({
      name: customer.name,
      email: customer.email,
      password: testPassword(customer.slug),
      landing: resolvePortalHome({
        canViewReports: customer.canViewReports,
        canViewInputs: customer.canViewInputs,
      }),
      reports: customer.canViewReports ? "ja" : "nein",
      inputs: customer.canViewInputs ? "ja" : "nein",
    });
  }

  console.log("\nTestkunden angelegt/aktualisiert:\n");
  console.table(summary);
  console.log("\nHinweis: Offene Input-Anfragen koennen n8n-Benachrichtigungen ausloesen.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
