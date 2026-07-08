export default function DatenschutzPage() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-5">
      <h1 className="text-4xl">Datenschutzerklaerung</h1>
      <p>
        Diese Anwendung verarbeitet personenbezogene Daten ausschliesslich zur Bereitstellung des RAIS Client Portals und
        zur Kommunikation ueber Status-Reports und Input-Anfragen.
      </p>
      <section>
        <h2 className="text-2xl mb-2">Subprozessoren</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Supabase (Region Frankfurt, Datenbank, Authentifizierung, Storage)</li>
          <li>Vercel (Region fra1, Hosting)</li>
          <li>Resend (EU, transaktionale E-Mails fuer Portal-Benachrichtigungen)</li>
          <li>Hostinger/n8n (Vilnius, Orchestrierung von Webhooks)</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl mb-2">Cookies</h2>
        <p>
          Es werden ausschliesslich technisch notwendige Session-Cookies verwendet. Ein Consent-Banner ist daher nicht
          erforderlich.
        </p>
      </section>
      <section>
        <h2 className="text-2xl mb-2">Loeschkonzept</h2>
        <p>
          Bei Loeschung eines Kunden werden die Daten ueber Cascade-Relations in der Datenbank entfernt und zugehoerige
          Dateien per Storage-Cleanup-Prozess geloescht.
        </p>
      </section>
    </main>
  );
}
