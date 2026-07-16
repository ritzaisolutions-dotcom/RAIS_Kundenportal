# E-Mail Templates (Deutsch)

## report_published

- Betreff: `Neuer Status-Report im RAIS Portal`
- Vorschautext: `Es gibt ein neues Update zu Ihrem Projekt.`
- HTML:

```html
<p>Guten Tag,</p>
<p>es wurde ein neuer Status-Report für Ihr Projekt veröffentlicht.</p>
<p><a href="https://portal.ritz-ai.solutions/portal/reports/{{report_id}}">Zum Report</a></p>
<p>Viele Grüße<br />RAIS</p>
```

## input_requested

- Betreff: `Neue Input-Anfrage im RAIS Portal`
- Vorschautext: `Bitte Rückmeldung bis zur Frist.`
- HTML:

```html
<p>Guten Tag,</p>
<p>es wurde eine neue Input-Anfrage für Sie erstellt:</p>
<p><strong>{{request_title}}</strong></p>
<p>Fälligkeitsdatum: {{due_date}}</p>
<p><a href="https://portal.ritz-ai.solutions/portal/inputs/{{request_id}}">Zur Anfrage</a></p>
<p>Viele Grüße<br />RAIS</p>
```

## input_submitted (Kevin Alert)

- Betreff: `Neue Input-Einreichung eingegangen`
- HTML:

```html
<p>Neue Einreichung im RAIS Portal.</p>
<ul>
  <li>Request-ID: {{request_id}}</li>
  <li>Client-ID: {{client_id}}</li>
</ul>
```

## customer_request_created

- Betreff (Kunde): `Ihre Anfrage wurde übermittelt – RAIS Portal`
- Betreff (RAIS Alert): `Neue Kundenanfrage im RAIS Portal`
- HTML (Kunde):

```html
<p>Guten Tag,</p>
<p>vielen Dank – wir haben Ihre Anfrage erhalten:</p>
<p><strong>{{subject}}</strong></p>
<p>Kategorie: {{category}} · Bereich: {{area}} · Projekt: {{project_name}}</p>
<p><a href="https://portal.ritz-ai.solutions/portal/requests/{{request_id}}">Anfrage im Portal ansehen</a></p>
<p>Viele Grüße<br />RAIS</p>
```

## customer_request_answered

- Betreff: `Antwort zu Ihrer Anfrage – RAIS Portal`
- HTML:

```html
<p>Guten Tag,</p>
<p>es gibt eine Rückmeldung zu Ihrer Anfrage <strong>{{subject}}</strong>.</p>
<p><a href="https://portal.ritz-ai.solutions/portal/requests/{{request_id}}">Im Portal ansehen</a></p>
<p>Viele Grüße<br />RAIS</p>
```
