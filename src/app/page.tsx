import { cookies } from 'next/headers'
import { createClient } from "@/lib/client";

export default async function Home() {
  const cookieStore = await cookies()

  return (
    <ul>
     
    </ul>
  )
}