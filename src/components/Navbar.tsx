'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Guitar, BookOpen, Zap, MessageSquare, LayoutDashboard, LogOut, Music, Library } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home',     icon: LayoutDashboard },
  { href: '/learn',     label: 'Learn',    icon: BookOpen },
  { href: '/practice',  label: 'Practice', icon: Zap },
  { href: '/songs',     label: 'Songs',    icon: Music },
  { href: '/chat',      label: 'Chat',     icon: MessageSquare },
  { href: '/catalog',   label: 'Catalog',  icon: Library },
]

export function Navbar({ userName }: { userName?: string | null }) {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Guitar className="w-5 h-5 text-purple-600" />
          <span>Guitar Practice</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          {userName && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {userName}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>

      {/* Mobile nav — fixed bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur safe-area-bottom">
        <div className="flex">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] min-h-[56px] transition-colors ${
                  active ? 'text-purple-600' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
