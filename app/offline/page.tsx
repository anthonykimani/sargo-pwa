// app/offline/page.tsx
'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function OfflinePage() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">You&apos;re Offline</h1>
      <p className="text-gray-600 mb-8">Please check your internet connection and try again.</p>
      <Button 
        onClick={() => router.refresh()}
        className="bg-[#FF6C36] hover:bg-[#ff5a1f] text-white"
      >
        Try Again
      </Button>
    </div>
  )
}