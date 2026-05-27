import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/logout-button'
import { createClient } from '@/lib/server'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { authRoutes } from '@/app/routes'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect(authRoutes.LOGIN);
  }

  return (
    <div className="flex h-svh w-full items-center justify-center gap-2">
      <p>
        Welcome <span className='font-bold'>{data.claims.email}</span>
      </p>
      <LogoutButton />
      <ThemeToggle />
    </div>
  )
}
