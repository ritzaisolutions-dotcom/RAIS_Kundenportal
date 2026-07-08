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

- Betreff: `Neue Input-Submission eingegangen`
- HTML:

```html
<p>Neue Submission im RAIS Portal.</p>
<ul>
  <li>Request-ID: {{request_id}}</li>
  <li>Client-ID: {{client_id}}</li>
</ul>
```
