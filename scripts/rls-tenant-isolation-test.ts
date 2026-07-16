/**
 * RLS Cross-Tenant Isolation Test
 * ---------------------------------------------------------------------------
 * Prueft NICHT als Service-Role, sondern als echte, eingeloggte Nutzer, ob RLS
 * tatsaechlich verhindert, dass Kunde A Daten von Kunde B sehen oder schreiben
 * kann. Legt dafuer pro echtem Kunden einen temporaeren Testnutzer an,
 * authentifiziert sich als dieser Nutzer (anon key + Passwort-Login, nicht
 * Service-Role), und versucht dann quer ueber alle Kunden zu lesen/schreiben.
 * Erwartung ueberall: 0 Treffer / 0 betroffene Zeilen.
 *
 * WARUM DAS WICHTIG IST: Ein `execute_sql`/Service-Role-Query umgeht RLS
 * komplett (postgres-Rolle). Das beweist NICHTS ueber die tatsaechliche
 * Mandantentrennung. Nur ein echter authentifizierter Request mit dem
 * anon key + User-Access-Token durchlaeuft dieselbe Policy-Kette wie im
 * echten Portal.
 *
 * Ausfuehrung (lokal, NICHT im Sandbox - braucht echten Netzwerkzugriff auf
 * Supabase, der im Cowork-Sandbox aus bekannten Gruenden blockiert ist):
 *
 *   cd rais-portal
 *   npx tsx scripts/rls-tenant-isolation-test.ts
 *
 * Benoetigte env vars (aus .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Das Skript legt am Ende erzeugte Testnutzer und Testzeilen wieder selbst
 * auf (kein manuelles Aufraeumen noetig), auch wenn ein Assert fehlschlaegt.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error(
    "Fehlende env vars. Benoetigt: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (z.B. aus .env.local laden).",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const adminPortal = admin.schema("portal");

type Finding = { level: "PASS" | "LEAK" | "ERROR"; message: string };
const findings: Finding[] = [];
const cleanupUserIds: string[] = [];
const cleanupRequestIds: string[] = [];
const cleanupReportIds: string[] = [];
const cleanupCustomerRequestIds: string[] = [];

function record(level: Finding["level"], message: string) {
  findings.push({ level, message });
  console.log(`[${level}] ${message}`);
}

async function main() {
  console.log("== RLS Cross-Tenant Isolation Test ==\n");

  const { data: clients, error: clientsError } = await adminPortal
    .from("clients")
    .select("id,name,slug")
    .order("created_at");

  if (clientsError || !clients || clients.length < 2) {
    console.error("Brauche mindestens 2 echte Kunden in portal.clients, um Cross-Tenant-Isolation sinnvoll zu testen.");
    process.exit(1);
  }

  console.log(`Gefundene Kunden: ${clients.map((c) => c.name).join(", ")}\n`);

  // Fuer jeden Kunden: 1 temporaerer Testnutzer mit vollen Rechten + 1
  // Test-Input-Anfrage mit status "reopened": sichtbar für den Portal-User,
  // aber kein "open"-Notification-Trigger.
  // + 1 Test-Status-Report (status "published"), damit es ueberhaupt etwas
  // zum potenziell leaken gibt, auch wenn der Kunde noch keine echten Daten hat.
  type TenantContext = {
    clientId: string;
    clientName: string;
    userId: string;
    email: string;
    password: string;
    client: SupabaseClient;
    ownRequestId: string;
    ownReportId: string;
    ownCustomerRequestId: string;
  };

  const contexts: TenantContext[] = [];

  for (const client of clients) {
    const email = `rls-test-${client.id.slice(0, 8)}@ritz-ai.solutions.invalid`;
    const password = `RlsTest-${Math.random().toString(36).slice(2)}-${Date.now()}`;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { rls_test: true },
    });
    if (createError || !created.user) {
      record("ERROR", `Konnte Testnutzer fuer ${client.name} nicht anlegen: ${createError?.message}`);
      continue;
    }
    cleanupUserIds.push(created.user.id);

    const { error: cuError } = await adminPortal.from("client_users").insert({
      user_id: created.user.id,
      client_id: client.id,
      display_name: `RLS-Test (${client.name})`,
      can_view_reports: true,
      can_view_inputs: true,
      can_submit_requests: true,
    });
    if (cuError) {
      record("ERROR", `Konnte client_users-Zuordnung fuer ${client.name} nicht anlegen: ${cuError.message}`);
      continue;
    }

    const { data: reqRow, error: reqError } = await adminPortal
      .from("input_requests")
      .insert({
        client_id: client.id,
        title: `RLS-Test-Anfrage (${client.name})`,
        kind: "freetext",
        status: "reopened",
      })
      .select("id")
      .single();
    if (reqError || !reqRow) {
      record("ERROR", `Konnte Test-Input-Anfrage fuer ${client.name} nicht anlegen: ${reqError?.message}`);
      continue;
    }
    cleanupRequestIds.push(reqRow.id);

    const { data: reportRow, error: reportError } = await adminPortal
      .from("status_reports")
      .insert({
        client_id: client.id,
        title: `RLS-Test-Report (${client.name})`,
        body_md: "RLS isolation test report - safe to delete.",
        status: "published",
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (reportError || !reportRow) {
      record("ERROR", `Konnte Test-Status-Report fuer ${client.name} nicht anlegen: ${reportError?.message}`);
      continue;
    }
    cleanupReportIds.push(reportRow.id);

    // + 1 Test-Kundenanfrage (Kunde -> RAIS) im Status "revision", damit auch der
    //   Kunden-Schreibpfad (Event-Insert nur bei eigener revision-Anfrage) unter
    //   der PERMISSIVSTEN Bedingung getestet wird: bleibt nur der client_id-Riegel.
    const { data: crRow, error: crError } = await adminPortal
      .from("customer_requests")
      .insert({
        client_id: client.id,
        created_by: created.user.id,
        subject: `RLS-Test-Kundenanfrage (${client.name})`,
        category: "Allgemein",
        area: "Portal",
        project_name: "RLS-Test",
        description_md: "RLS isolation test - safe to delete.",
        status: "revision",
      })
      .select("id")
      .single();
    if (crError || !crRow) {
      record("ERROR", `Konnte Test-Kundenanfrage fuer ${client.name} nicht anlegen: ${crError?.message}`);
      continue;
    }
    cleanupCustomerRequestIds.push(crRow.id);

    // + 1 Event an der Kundenanfrage, damit es beim Event-Leak-Test ueberhaupt
    //   eine Zeile zum potenziellen Leaken gibt.
    const { error: crEventError } = await adminPortal.from("customer_request_events").insert({
      request_id: crRow.id,
      kind: "status_change",
      author_role: "admin",
      author_id: created.user.id,
      new_status: "revision",
      body_md: "RLS isolation test event - safe to delete.",
    });
    if (crEventError) {
      record("ERROR", `Konnte Test-Event fuer ${client.name} nicht anlegen: ${crEventError.message}`);
      continue;
    }

    const testClient = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: signInError } = await testClient.auth.signInWithPassword({ email, password });
    if (signInError) {
      record("ERROR", `Login als Testnutzer fuer ${client.name} fehlgeschlagen: ${signInError.message}`);
      continue;
    }

    contexts.push({
      clientId: client.id,
      clientName: client.name,
      userId: created.user.id,
      email,
      password,
      client: testClient,
      ownRequestId: reqRow.id,
      ownReportId: reportRow.id,
      ownCustomerRequestId: crRow.id,
    });
  }

  console.log(`\n${contexts.length} von ${clients.length} Test-Kontexten erfolgreich vorbereitet.\n`);
  console.log("-- Lese-Tests (SELECT) --\n");

  for (const ctx of contexts) {
    const portal = ctx.client.schema("portal");

    // 1) Eigene Daten muessen sichtbar sein (Positivkontrolle - sonst ist der
    //    Test selbst kaputt, nicht die RLS).
    const { data: ownReqs } = await portal.from("input_requests").select("id,client_id");
    const seenOwn = (ownReqs ?? []).some((r) => r.id === ctx.ownRequestId);
    if (!seenOwn) {
      record("ERROR", `${ctx.clientName}: eigene Test-Input-Anfrage NICHT sichtbar - Positivkontrolle fehlgeschlagen, Testaufbau pruefen.`);
    }

    // 2) Fremde Daten duerfen NICHT auftauchen, ueber alle anderen Kontexte.
    const foreignRequestIds = (ownReqs ?? []).map((r) => r.id).filter((id) => id !== ctx.ownRequestId);
    const otherClientIds = contexts.filter((o) => o.clientId !== ctx.clientId).map((o) => o.clientId);
    const leakedClientIds = (ownReqs ?? [])
      .map((r) => r.client_id)
      .filter((cid) => otherClientIds.includes(cid));

    if (leakedClientIds.length > 0) {
      record("LEAK", `${ctx.clientName}: input_requests liefert ${leakedClientIds.length} Zeile(n) von fremden Kunden zurueck!`);
    } else if (foreignRequestIds.length === 0) {
      record("PASS", `${ctx.clientName}: input_requests zeigt ausschliesslich eigene Zeilen.`);
    }

    const { data: ownReports } = await portal.from("status_reports").select("id,client_id");
    const reportLeaks = (ownReports ?? []).map((r) => r.client_id).filter((cid) => otherClientIds.includes(cid));
    if (reportLeaks.length > 0) {
      record("LEAK", `${ctx.clientName}: status_reports liefert ${reportLeaks.length} Zeile(n) von fremden Kunden zurueck!`);
    } else {
      record("PASS", `${ctx.clientName}: status_reports zeigt ausschliesslich eigene Zeilen.`);
    }

    const { data: ownClientUsers } = await portal.from("client_users").select("user_id,client_id");
    const clientUserLeaks = (ownClientUsers ?? []).filter((r) => r.user_id !== ctx.userId);
    if (clientUserLeaks.length > 0) {
      record("LEAK", `${ctx.clientName}: client_users liefert ${clientUserLeaks.length} fremde Nutzer-Zeile(n) zurueck!`);
    } else {
      record("PASS", `${ctx.clientName}: client_users zeigt nur die eigene Zeile.`);
    }

    // Kundenanfragen (Kunde -> RAIS): eigene sichtbar (Positivkontrolle), fremde nicht.
    const { data: ownCRs } = await portal.from("customer_requests").select("id,client_id");
    if (!(ownCRs ?? []).some((r) => r.id === ctx.ownCustomerRequestId)) {
      record("ERROR", `${ctx.clientName}: eigene Test-Kundenanfrage NICHT sichtbar - Positivkontrolle fehlgeschlagen, Testaufbau pruefen.`);
    }
    const crLeaks = (ownCRs ?? []).map((r) => r.client_id).filter((cid) => otherClientIds.includes(cid));
    if (crLeaks.length > 0) {
      record("LEAK", `${ctx.clientName}: customer_requests liefert ${crLeaks.length} Zeile(n) von fremden Kunden zurueck!`);
    } else {
      record("PASS", `${ctx.clientName}: customer_requests zeigt ausschliesslich eigene Zeilen.`);
    }

    // Event-Thread: darf keine Events fremder Anfragen zurueckgeben (Events haben
    // keine client_id - Leak-Erkennung ueber die fremden request_ids).
    const foreignCustomerRequestIds = contexts
      .filter((o) => o.clientId !== ctx.clientId)
      .map((o) => o.ownCustomerRequestId);
    const { data: ownEvents } = await portal.from("customer_request_events").select("id,request_id");
    const eventLeaks = (ownEvents ?? []).filter((e) => foreignCustomerRequestIds.includes(e.request_id));
    if (eventLeaks.length > 0) {
      record("LEAK", `${ctx.clientName}: customer_request_events liefert ${eventLeaks.length} Event(s) fremder Anfragen zurueck!`);
    } else {
      record("PASS", `${ctx.clientName}: customer_request_events zeigt nur Events eigener Anfragen.`);
    }

    // 3) Direkter, gezielter Zugriff auf eine KONKRETE fremde Zeilen-ID -
    //    fangt Faelle, die ein `select *`-Leak-Test uebersehen wuerde, weil
    //    manche Policies nur bei ungefiltertem SELECT greifen.
    for (const other of contexts.filter((o) => o.clientId !== ctx.clientId)) {
      const { data: targeted } = await portal.from("input_requests").select("id").eq("id", other.ownRequestId);
      if (targeted && targeted.length > 0) {
        record("LEAK", `${ctx.clientName}: gezielter SELECT auf fremde Anfrage-ID von ${other.clientName} liefert ein Ergebnis!`);
      }

      const { data: targetedCR } = await portal.from("customer_requests").select("id").eq("id", other.ownCustomerRequestId);
      if (targetedCR && targetedCR.length > 0) {
        record("LEAK", `${ctx.clientName}: gezielter SELECT auf fremde Kundenanfrage-ID von ${other.clientName} liefert ein Ergebnis!`);
      }
    }
  }

  console.log("\n-- Schreib-Tests (UPDATE/INSERT auf fremde Daten) --\n");

  for (const ctx of contexts) {
    const portal = ctx.client.schema("portal");
    for (const other of contexts.filter((o) => o.clientId !== ctx.clientId)) {
      const { data: updated, error: updateError } = await portal
        .from("input_requests")
        .update({ title: "RLS-LEAK-TEST-SHOULD-NOT-APPLY" })
        .eq("id", other.ownRequestId)
        .select("id");
      if (updateError) {
        record("PASS", `${ctx.clientName}: UPDATE auf fremde Anfrage von ${other.clientName} korrekt abgelehnt (${updateError.message}).`);
      } else if (updated && updated.length > 0) {
        record("LEAK", `${ctx.clientName}: UPDATE auf fremde Anfrage von ${other.clientName} hat tatsaechlich eine Zeile veraendert!`);
      } else {
        record("PASS", `${ctx.clientName}: UPDATE auf fremde Anfrage von ${other.clientName} betraf 0 Zeilen (RLS greift).`);
      }

      const { data: inserted, error: insertError } = await portal
        .from("input_submissions")
        .insert({
          request_id: other.ownRequestId,
          client_id: other.clientId,
          submitted_by: ctx.userId,
          data: { rls_leak_test: true },
        })
        .select("id");
      if (!insertError && inserted && inserted.length > 0) {
        record("LEAK", `${ctx.clientName}: INSERT einer Einreichung fuer fremde Anfrage von ${other.clientName} wurde akzeptiert!`);
        // Sofort wieder entfernen, falls es durchgerutscht ist.
        await adminPortal.from("input_submissions").delete().eq("id", inserted[0].id);
      } else {
        record("PASS", `${ctx.clientName}: INSERT fuer fremde Anfrage von ${other.clientName} korrekt abgelehnt.`);
      }

      // UPDATE auf fremde Kundenanfrage (die fremde Anfrage steht auf "revision",
      // also greift nur noch der client_id-Riegel der Update-Policy).
      const { data: crUpdated, error: crUpdateError } = await portal
        .from("customer_requests")
        .update({ status: "submitted" })
        .eq("id", other.ownCustomerRequestId)
        .select("id");
      if (crUpdateError) {
        record("PASS", `${ctx.clientName}: UPDATE auf fremde Kundenanfrage von ${other.clientName} korrekt abgelehnt (${crUpdateError.message}).`);
      } else if (crUpdated && crUpdated.length > 0) {
        record("LEAK", `${ctx.clientName}: UPDATE auf fremde Kundenanfrage von ${other.clientName} hat tatsaechlich eine Zeile veraendert!`);
      } else {
        record("PASS", `${ctx.clientName}: UPDATE auf fremde Kundenanfrage von ${other.clientName} betraf 0 Zeilen (RLS greift).`);
      }

      // INSERT eines Kunden-Events an fremder Anfrage - muss abgelehnt werden.
      const { data: crEventInserted, error: crEventInsertError } = await portal
        .from("customer_request_events")
        .insert({
          request_id: other.ownCustomerRequestId,
          kind: "message",
          author_role: "customer",
          author_id: ctx.userId,
          body_md: "RLS-LEAK-TEST-SHOULD-NOT-APPLY",
        })
        .select("id");
      if (!crEventInsertError && crEventInserted && crEventInserted.length > 0) {
        record("LEAK", `${ctx.clientName}: INSERT eines Events an fremder Kundenanfrage von ${other.clientName} wurde akzeptiert!`);
        await adminPortal.from("customer_request_events").delete().eq("id", crEventInserted[0].id);
      } else {
        record("PASS", `${ctx.clientName}: INSERT eines Events an fremder Kundenanfrage von ${other.clientName} korrekt abgelehnt.`);
      }
    }
  }

  console.log("\n== Aufraeumen ==\n");
  for (const id of cleanupRequestIds) await adminPortal.from("input_requests").delete().eq("id", id);
  for (const id of cleanupReportIds) await adminPortal.from("status_reports").delete().eq("id", id);
  // Kundenanfragen VOR den Nutzern loeschen: customer_requests.created_by referenziert
  // auth.users ohne ON DELETE, sonst blockiert die FK das Loeschen. Events cascaden mit.
  for (const id of cleanupCustomerRequestIds) await adminPortal.from("customer_requests").delete().eq("id", id);
  for (const id of cleanupUserIds) await admin.auth.admin.deleteUser(id);
  console.log(
    `Aufgeraeumt: ${cleanupRequestIds.length} Test-Anfragen, ${cleanupReportIds.length} Test-Reports, ${cleanupCustomerRequestIds.length} Test-Kundenanfragen, ${cleanupUserIds.length} Testnutzer.\n`,
  );

  const leaks = findings.filter((f) => f.level === "LEAK");
  const errors = findings.filter((f) => f.level === "ERROR");
  const passes = findings.filter((f) => f.level === "PASS");

  console.log("== Ergebnis ==");
  console.log(`PASS:  ${passes.length}`);
  console.log(`LEAK:  ${leaks.length}`);
  console.log(`ERROR: ${errors.length}`);

  if (leaks.length > 0) {
    console.error("\n!! MANDANTENTRENNUNG VERLETZT - siehe LEAK-Zeilen oben. Nicht ignorieren, sofort fixen. !!");
    process.exit(1);
  }
  if (errors.length > 0) {
    console.error("\nTest konnte nicht vollstaendig durchlaufen (siehe ERROR-Zeilen) - Ergebnis nicht als 'sicher' werten.");
    process.exit(1);
  }
  console.log("\nKeine Cross-Tenant-Lecks gefunden.");
}

main().catch((err) => {
  console.error("Unerwarteter Fehler im Testlauf:", err);
  process.exit(1);
});
