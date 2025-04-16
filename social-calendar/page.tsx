// app/page.tsx

import SocialCalendarApp from '@/components/SocialCalendarApp'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <SocialCalendarApp />
      </div>
    </main>
  )
}
