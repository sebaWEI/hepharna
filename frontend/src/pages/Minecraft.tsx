import { Cube } from '@phosphor-icons/react'
import { useChallengeConfig } from '../hooks/useChallengeConfig'

export function MinecraftPage() {
  const { config } = useChallengeConfig()
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <p className="inline-flex items-center gap-2 font-mono text-sm tracking-[0.2em] text-accent">
        <Cube size={18} />
        MINECRAFT BIO LAB
      </p>
      <h1 className="mt-4 text-4xl md:text-5xl">Explore our Minecraft Bio Lab</h1>
      <p className="mt-4 max-w-[50ch] text-mute">
        A playable lab world for the HEPHA-RNA event. This page is the connection guide. The website
        does not talk to the Minecraft server directly.
      </p>
      <div className="mt-8 rounded-[16px] border border-line bg-surface p-6">
        <p className="text-sm text-mute">Server address</p>
        <p className="mt-2 font-mono text-2xl">
          {config.minecraft_server_address || 'Coming soon'}
        </p>
        <p className="mt-6 whitespace-pre-wrap text-mute">
          {config.minecraft_info ||
            'Ask an event staff member for the current IP, version, and how to join the Bio Lab world.'}
        </p>
      </div>
    </section>
  )
}
