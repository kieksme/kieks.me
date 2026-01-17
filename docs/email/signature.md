# E-Mail Signatur


```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>JS Bin</title>
</head>
<body>
<table style="font-family: Calibri, sans-serif; font-size: 14px; color: #333;">
  <tr>
    <td style="padding: 10px 0;">
      <strong>kieks.me GbR</strong><br>
      Geschäftsführung: Thomas Schöne, André Lademann<br>
      Hardenbergstraße 48, 04275 Leipzig, Germany<br>
      <a href="mailto:info@kieks.me" style="color: #1a73e8; text-decoration: none;">info@kieks.me</a> | 
      <a href="https://kieks.me" style="color: #1a73e8; text-decoration: none;">www.kieks.me</a><br>
      USt-IdNr.: DE123456789
    </td>
  </tr>
  <tr>
    <td>
      <img src="data:image/png;base64,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" 
           alt="kieks.me Logo" width="120">
    </td>
  </tr>
  <tr>
    <td style="padding-top: 10px; font-size: 12px; color: #777;">
      Diese E-Mail kann vertrauliche Informationen enthalten. Wenn Sie nicht der beabsichtigte Empfänger sind, informieren Sie uns bitte und löschen Sie die E-Mail.
    </td>
  </tr>
</table>
</body>
</html>
```


```plain
Beste Grüße  

André

-- 

kieks.me GbR von Thomas Schöne und André Lademann
Hardenbergstraße 48 - 04275 Leipzig - Germany
Gesellschafter: Thomas Schöne, André Lademann
VAT-ID/USt-IdNr: DE452741849
Inhaltlich verantwortlich gemäß § 18 Abs. 2 MStV: Thomas Schöne
Unsere Hinweise zur Verarbeitung Ihrer personenbezogenen Daten finden Sie unter https://kieks.me/datenschutzerklärung/


````
