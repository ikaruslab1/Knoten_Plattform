import { Resend } from 'resend'
import { WelcomeEmail } from '@/components/emails/WelcomeEmail'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('[email/welcome] Error: RESEND_API_KEY is not configured')
      return Response.json({ error: 'Mail server configuration error' }, { status: 500 })
    }
    const sanitizedApiKey = apiKey.trim().replace(/^["']|["']$/g, '')
    const resend = new Resend(sanitizedApiKey)

    const body = await request.json()
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      numeroCuenta,
      correoInstitucional,
      correoPersonal,
      telefono,
      password,
    } = body

    const { error } = await resend.emails.send({
      from: 'Knoten <noreply@send.knoten.scherry.click>',
      to: [correoPersonal, correoInstitucional].filter(Boolean),
      subject: `Bienvenido a Knoten, ${nombre}`,
      react: WelcomeEmail({
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        numeroCuenta,
        correoInstitucional,
        correoPersonal,
        telefono,
        password,
      }),
    })

    if (error) {
      console.error('[email/welcome]', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('[email/welcome] Unexpected error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
