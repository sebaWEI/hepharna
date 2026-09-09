import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LandingPage() {
  const { user } = useAuth()
  return (
    <section className="mx-auto grid min-h-[calc(100dvh-8rem)] max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="font-mono text-sm tracking-[0.28em] text-accent">HEPHA-RNA</p>
        <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-[1.05] md:text-7xl">
          Design Challenge
        </h1>
        <p className="mt-6 text-2xl text-ink md:text-3xl">Design. Predict. Compete.</p>
        <p className="mt-4 max-w-[36ch] text-lg text-mute">
          Design your own RNA. Let AI evaluate it. Beat the leaderboard.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={user ? '/challenge' : '/register'}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-bg"
          >
            Join Challenge
            <ArrowRight size={16} />
          </Link>
          <Link to="/leaderboard" className="rounded-full border border-line px-6 py-3">
            View Leaderboard
          </Link>
        </div>
        <Link to="/minecraft" className="mt-5 inline-block text-sm text-mute hover:text-accent">
          Minecraft Bio Lab
        </Link>
      </div>
      <div className="rounded-[16px] border border-line bg-surface p-6 md:p-8">
        <p className="font-mono text-xs tracking-[0.2em] text-mute">HOW IT WORKS</p>
        <ol className="mt-6 grid gap-5 text-lg">
          <li>
            <span className="font-mono text-accent">01</span> Design your RNA
          </li>
          <li>
            <span className="font-mono text-accent">02</span> Submit
          </li>
          <li>
            <span className="font-mono text-accent">03</span> Get your AI score
          </li>
          <li>
            <span className="font-mono text-accent">04</span> Check your rank
          </li>
          <li>
            <span className="font-mono text-accent">05</span> Try again
          </li>
        </ol>
        <p className="mt-8 font-mono text-sm leading-loose text-base-a">
          AUGCCAGU <span className="text-base-u">CCAGUACG</span>{' '}
          <span className="text-base-g">AUCGAUGC</span> <span className="text-base-c">CAGUAC</span>
        </p>
      </div>
    </section>
  )
}
