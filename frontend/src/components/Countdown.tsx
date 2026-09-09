import { useEffect, useState } from 'react'

export function Countdown({ endTime }: { endTime: string | null }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!endTime) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [endTime])

  if (!endTime) return null
  const remaining = new Date(endTime).getTime() - now
  if (remaining <= 0) {
    return <p className="font-mono text-xl tracking-[0.2em] text-mute">CHALLENGE ENDED</p>
  }
  const total = Math.floor(remaining / 1000)
  const hours = String(Math.floor(total / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')
  return (
    <div className="text-center">
      <p className="text-xs tracking-[0.25em] text-mute">CHALLENGE ENDS IN</p>
      <p className="mt-2 font-mono text-4xl tracking-[0.18em] md:text-5xl">
        {hours}:{minutes}:{seconds}
      </p>
    </div>
  )
}
