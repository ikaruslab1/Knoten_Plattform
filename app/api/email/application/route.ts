import { Resend } from 'resend'
import { ApplicationEmail } from '@/components/emails/ApplicationEmail'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('[email/application] Error: RESEND_API_KEY is not configured')
      return Response.json({ error: 'Mail server configuration error' }, { status: 500 })
    }
    const resend = new Resend(apiKey)

    const body = await request.json()
    const { freelancerId, oficinaNombre, rolesVacante } = body

    // Get freelancer email from profiles
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre, apellido_paterno, correo_personal')
      .eq('id', freelancerId)
      .single()

    if (!profile?.correo_personal) {
      return Response.json({ error: 'Freelancer not found' }, { status: 404 })
    }

    const freelancerNombre = `${profile.nombre} ${profile.apellido_paterno}`

    const { error } = await resend.emails.send({
      from: 'Knoten <noreply@knoten.mx>',
      to: [profile.correo_personal],
      subject: `Tu postulación a ${oficinaNombre} fue enviada`,
      react: ApplicationEmail({
        freelancerNombre,
        oficinaNombre,
        vacanteRoles: rolesVacante || [],
      }),
    })

    if (error) {
      console.error('[email/application]', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('[email/application] Unexpected error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
