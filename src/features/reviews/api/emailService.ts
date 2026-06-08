import { REJECTION_OPTIONS } from './reviewService';

export interface RejectionEmailData {
  policyNumber: string;
  clientName: string;
  agentName: string;
  agentCode: string;
  agentEmail: string;
  rejectionReason: string;
  rejectionOptions: string[];
  portalUrl: string; // Enlace seguro para que el agente suba el archivo corregido
  documentDate?: string;
  fidelisEntryDate?: string;
}

/**
 * Genera la plantilla HTML formateada para el correo de notificación de rechazo.
 * El diseño utiliza colores institucionales, bordes redondeados, sombras suaves y tipografía moderna.
 */
export function generateRejectionHtml(data: RejectionEmailData): string {
  const optionsHtml = data.rejectionOptions
    .map((opt) => {
      const label = REJECTION_OPTIONS.find((o) => o.value === opt)?.label ?? opt;
      return `<li style="margin-bottom: 6px;"><strong>${label}</strong></li>`;
    })
    .join('');

  const isDirect = data.agentCode === '0' || data.agentCode?.toUpperCase() === 'DIRECTO' || data.agentName?.toLowerCase().includes('directo');
  const introText = isDirect
    ? `Estimado/a cliente <strong>${data.clientName}</strong>,<br><br>
       Le notificamos que la contragarantía física de su póliza de fianza ha sido <strong>rechazada</strong> por nuestro Departamento Legal debido a inconsistencias que requieren su corrección.`
    : `Estimado/a agente <strong>${data.agentName}</strong>,<br><br>
       Le notificamos que el documento de contragarantía física ingresado para la póliza detallada a continuación ha sido <strong>rechazado</strong> por nuestro Departamento Legal.`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contragarantía Rechazada - Fidelis</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      overflow: hidden;
    }
    .header {
      background-color: #dc2626; /* Rojo institucional */
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .body-content {
      padding: 32px 24px;
    }
    .intro-text {
      font-size: 15px;
      line-height: 1.6;
      color: #4b5563;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .info-card {
      background-color: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .info-grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 480px) {
      .info-grid {
        grid-template-cols: 1fr;
      }
    }
    .info-item {
      font-size: 13px;
    }
    .info-label {
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .info-value {
      font-weight: 700;
      color: #111827;
    }
    .rejection-box {
      background-color: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .rejection-title {
      font-size: 14px;
      font-weight: 700;
      color: #991b1b;
      margin-top: 0;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .rejection-list {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: #7f1d1d;
    }
    .detailed-reason {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px dashed #fca5a5;
      font-size: 13px;
      color: #7f1d1d;
    }
    .detailed-reason p {
      margin: 0;
    }
    .action-button-container {
      text-align: center;
      margin-bottom: 20px;
    }
    .action-button {
      display: inline-block;
      background-color: #111827; /* Botón oscuro y elegante */
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      transition: background-color 0.2s;
    }
    .footer {
      text-align: center;
      padding: 24px;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Contragarantía Rechazada</h1>
    </div>
    <div class="body-content">
      <p class="intro-text">
        ${introText}
      </p>

      <div class="info-card">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Póliza / Fianza</div>
            <div class="info-value">${data.policyNumber}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Cliente / Fiado</div>
            <div class="info-value">${data.clientName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Código Agente</div>
            <div class="info-value">${data.agentCode}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Fecha del Documento</div>
            <div class="info-value">${data.documentDate || 'No especificada'}</div>
          </div>
        </div>
      </div>

      <div class="rejection-box">
        <div class="rejection-title">Motivos del Rechazo</div>
        <ul class="rejection-list">
          ${optionsHtml}
        </ul>
        ${
          data.rejectionReason
            ? `<div class="detailed-reason">
                 <strong>Detalle y Observaciones Legales:</strong>
                 <p style="margin-top: 6px; font-style: italic;">"${data.rejectionReason}"</p>
               </div>`
            : ''
        }
      </div>

      <div class="action-button-container">
        <a href="${data.portalUrl}" class="action-button" target="_blank">Subir Documento Corregido</a>
      </div>
    </div>
    <div class="footer">
      <p>Este es un mensaje automático del Sistema de Gestión de Contragarantías - Fidelis.</p>
      <p>Por favor, no responda directamente a este correo. Si tiene dudas, póngase en contacto con el departamento legal.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Servicio configurable para realizar el envío de correo.
 * Su equipo de tecnología debe configurar la URL de su API y los encabezados necesarios.
 */
export const emailService = {
  async sendRejectionEmail(data: RejectionEmailData): Promise<void> {
    // ⚠️ NOTA DE TECNOLOGÍA: Cambie esta URL por su endpoint de SendGrid si utiliza un proxy,
    // o deje el valor por defecto de SendGrid v3
    const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || 'https://api.sendgrid.com/v3/mail/send';
    const EMAIL_API_KEY = import.meta.env.VITE_EMAIL_API_KEY || '';

    const htmlBody = generateRejectionHtml(data);

    const cleanEmails = data.agentEmail
      ? data.agentEmail
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean)
          .join(', ')
      : '';

    const toArray = cleanEmails
      .split(',')
      .map((email) => ({ email: email.trim() }))
      .filter((item) => Boolean(item.email));

    try {
      console.log(`[EmailService] Enviando correo de rechazo vía SendGrid a: ${cleanEmails} para póliza: ${data.policyNumber}`);

      const response = await fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EMAIL_API_KEY}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: toArray,
            },
          ],
          from: {
            email: 'no-reply@fidelis.com.gt', // Remitente verificado de su cuenta de SendGrid
            name: 'Fidelis Legal',
          },
          subject: `RECHAZADO: Contragarantía Póliza ${data.policyNumber} - ${data.clientName}`,
          content: [
            {
              type: 'text/html',
              value: htmlBody,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en SendGrid (${response.status}): ${errorText}`);
      }

      console.log('[EmailService] Correo enviado exitosamente vía SendGrid.');
    } catch (error) {
      console.error('[EmailService] Error al enviar el correo vía SendGrid:', error);
      throw error;
    }
  },
};
