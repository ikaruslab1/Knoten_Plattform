'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { resolveTheme } from '@/lib/types/profile-theme'
import type { ProfileTheme } from '@/lib/types/profile-theme'

export interface SaveThemeResult {
  success: boolean
  error?: string
}

export async function saveProfileTheme(theme: ProfileTheme): Promise<SaveThemeResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    // Resolve and validate the theme before saving
    const resolvedTheme = resolveTheme(theme)

    const { error } = await supabase
      .from('freelancer_profiles')
      .update({ profile_theme: resolvedTheme })
      .eq('id', user.id)

    if (error) {
      console.error('[saveProfileTheme] Supabase error:', error)
      return { success: false, error: 'Error al guardar el tema' }
    }

    revalidatePath('/freelancer/profile')
    revalidatePath('/freelancer/profile/theme')

    return { success: true }
  } catch (err) {
    console.error('[saveProfileTheme] Unexpected error:', err)
    return { success: false, error: 'Error inesperado' }
  }
}
