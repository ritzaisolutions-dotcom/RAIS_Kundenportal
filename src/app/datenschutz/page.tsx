export default function DatenschutzPage() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-5">
      <h1 className="text-4xl">Datenschutzerklärung</h1>
      <p>
        Diese Anwendung verarbeitet personenbezogene Daten ausschließlich zur Bereitstellung des RAIS Client Portals und
        zur Kommunikation über Status-Reports und Input-Anfragen.
      </p>
      <section>
        <h2 className="text-2xl mb-2">Subprozessoren</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Supabase (Region Frankfurt, Datenbank, Authentifizierung, Storage)</li>
          <li>Vercel (Region fra1, Hosting)</li>
          <li>SMTP-E-Mail-Dienst (über n8n Email Send Node angebunden)</li>
          <li>Hostinger/n8n (Vilnius, Orchestrierung von Webhooks)</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl mb-2">Cookies</h2>
        <p>
          Es werden ausschließlich technisch notwendige Session-Cookies verwendet. Ein Consent-Banner ist daher nicht
          erforderlich.
        </p>
      </section>
      <section>
        <h2 className="text-2xl mb-2">Löschkonzept</h2>
        <p>
          Bei Löschung eines Kunden werden die Daten über Cascade-Relations in der Datenbank entfernt und zugehörige Dateien
          per Storage-Cleanup-Prozess gelöscht.
        </p>
      </section>
    </main>
  );
}
