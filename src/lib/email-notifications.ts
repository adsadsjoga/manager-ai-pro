type AlertEmailParams = {
  to: string
  accountName?: string | null
  severity: string
  title: string
  message: string
  campaignName?: string | null
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'Ads Manager AI <noreply@adsmanagerai.pro>'

export async function sendAlertEmail(params: AlertEmailParams) {
  if (!RESEND_API_KEY) {
    return {
      sent: false,
      reason: 'RESEND_API_KEY nao configurada',
    }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: params.to,
      subject: `[Ads Manager AI] ${params.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h2>${params.title}</h2>
          <p><strong>Conta:</strong> ${params.accountName || 'Conta de anuncios'}</p>
          <p><strong>Campanha:</strong> ${params.campaignName || 'Conta'}</p>
          <p><strong>Severidade:</strong> ${params.severity}</p>
          <p>${params.message}</p>
          <p style="color:#6b7280;font-size:12px">Alerta gerado automaticamente pelo Ads Manager AI Pro.</p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    return {
      sent: false,
      reason: `Resend retornou ${response.status}`,
    }
  }

  return {
    sent: true,
  }
}
