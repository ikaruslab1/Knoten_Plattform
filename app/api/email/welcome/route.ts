import { Resend } from 'resend'
import { WelcomeEmail } from '@/components/emails/WelcomeEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      numeroCuenta,
      correoInstitucional,
      correoPersonal,
      telefono,
    } = body

    const { error } = await resend.emails.send({
      from: 'Knoten <noreply@knoten.mx>',
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
