import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Guitar, Music, Zap, MessageSquare } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero */}
      <div className="container mx-auto px-4 py-12 sm:py-20 text-center">
        <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
          AI-Powered Guitar Learning
        </Badge>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
          Guitar Practice
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
          Learn chords with real-time microphone detection, Guitar Hero-style practice,
          and an AI assistant that creates custom progressions from your learned chords.
        </p>
        <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
            <Link href="/auth/register">Get Started Free</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/20 text-black">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              icon: <Guitar className="w-8 h-8 text-purple-400" />,
              title: 'Real-time Detection',
              desc: 'Play into your mic and instantly see which chord you\'re playing with confidence scores',
            },
            {
              icon: <Zap className="w-8 h-8 text-yellow-400" />,
              title: 'Guitar Hero Mode',
              desc: 'Chord blocks scroll toward you in time with a metronome. Hit the right chord to score!',
            },
            {
              icon: <MessageSquare className="w-8 h-8 text-green-400" />,
              title: 'AI Assistant',
              desc: 'Ask GPT-4o for custom progressions based on your learned chords — then practice them directly',
            },
            {
              icon: <Music className="w-8 h-8 text-blue-400" />,
              title: 'Built-in Tuner',
              desc: 'Chromatic tuner with needle gauge, perfect for getting in tune before every session',
            },
          ].map((f, i) => (
            <Card key={i} className="bg-white/5 border-white/10 text-white">
              <CardContent className="p-6">
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Curriculum */}
        <div className="mt-10 sm:mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">9-Chord Curriculum</h2>
          <p className="text-slate-400 mb-8">Progress from beginner chords to the challenging F barre chord</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Em', 'Am', 'E', 'A', 'D', 'G', 'C', 'Dm', 'F'].map((chord, i) => (
              <div key={chord} className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold">
                  {chord}
                </div>
                {i < 8 && <div className="w-4 h-0.5 bg-purple-500/30" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
