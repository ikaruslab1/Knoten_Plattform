import { createClient } from '@/lib/supabase/server'
import { ConfirmClient } from '@/components/auth/ConfirmClient'

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const token_hash = params.token_hash as string
  const type = params.type as string
  const code = params.code as string
  let isVerified = false

  const supabase = await createClient()

  if (token_hash && type === 'email') {
    const { error } = await supabase.auth.verifyOtp({
      type: 'email',
      token_hash,
    })
    if (!error) {
      isVerified = true
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      isVerified = true
    }
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user && user.email_confirmed_at) {
      isVerified = true
    }
  }

  return <ConfirmClient initialVerified={isVerified} />
}

