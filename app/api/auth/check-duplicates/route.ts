import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { correoInstitucional, correoPersonal, telefono, numeroCuenta } =
      await request.json()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check correo_institucional
    if (correoInstitucional) {
      const { data: instData } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('correo_institucional', correoInstitucional.trim())
        .limit(1)

      if (instData && instData.length > 0) {
        return NextResponse.json({
          isDuplicate: true,
          field: 'correoInstitucional',
          message: 'El correo institucional ya está registrado.',
        })
      }
    }

    // Check correo_personal
    if (correoPersonal) {
      const { data: persData } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('correo_personal', correoPersonal.trim())
        .limit(1)

      if (persData && persData.length > 0) {
        return NextResponse.json({
          isDuplicate: true,
          field: 'correoPersonal',
          message: 'El correo personal ya está registrado.',
        })
      }
    }

    // Check telefono
    if (telefono) {
      const { data: telData } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('telefono', telefono.trim())
        .limit(1)

      if (telData && telData.length > 0) {
        return NextResponse.json({
          isDuplicate: true,
          field: 'telefono',
          message: 'El número de teléfono ya está registrado.',
        })
      }
    }

    // Check numero_cuenta
    if (numeroCuenta) {
      const { data: cuentaData } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('numero_cuenta', numeroCuenta.trim())
        .limit(1)

      if (cuentaData && cuentaData.length > 0) {
        return NextResponse.json({
          isDuplicate: true,
          field: 'numeroCuenta',
          message: 'Este número de cuenta UNAM ya está registrado.',
        })
      }
    }

    return NextResponse.json({ isDuplicate: false })
  } catch (err) {
    console.error('Error checking duplicate profile values:', err)
    return NextResponse.json(
      { error: 'Error al verificar duplicados en la base de datos' },
      { status: 500 }
    )
  }
}
