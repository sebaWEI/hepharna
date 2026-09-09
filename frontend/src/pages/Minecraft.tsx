import { ArrowSquareOut, Cube, GithubLogo, PlayCircle } from '@phosphor-icons/react'
import { useChallengeConfig } from '../hooks/useChallengeConfig'

const MOD_REPO = 'https://github.com/sebaWEI/PekingHSC2026MinecraftMod'
const VIDEO_PAGE = 'https://www.bilibili.com/video/BV1ShRcBpETA'
const VIDEO_EMBED =
  'https://player.bilibili.com/player.html?bvid=BV1ShRcBpETA&page=1&high_quality=1&danmaku=0&as_wide=1'

const loop = [
  { title: 'Collect', body: 'Kill mobs for Unknown Biological Tissue.' },
  { title: 'Identify', body: 'Craft tissue to reveal hidden DNA parts.' },
  { title: 'Assemble', body: 'Build plasmids in the Plasmid Assembler.' },
  { title: 'Transform', body: 'Move engineered plasmids into competent E. coli.' },
  { title: 'Express', body: 'Grow proteins with the right nutrient broth.' },
  { title: 'Enhance', body: 'Smith purified proteins onto your gear.' },
]

export function MinecraftPage() {
  const { config } = useChallengeConfig()
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
      <p className="inline-flex items-center gap-2 font-mono text-sm tracking-[0.2em] text-accent">
        <Cube size={18} />
        PEKING HSC · iGEM 2026
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl md:text-6xl">SynBio Crafter</h1>
      <p className="mt-3 text-xl text-mute">合成生物学模组</p>
      <p className="mt-4 max-w-[52ch] text-lg text-mute">
        An educational Minecraft Fabric mod that teaches synthetic biology through play. Extract DNA,
        assemble plasmids, transform bacteria, then bio-enhance your gear.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={MOD_REPO}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-bg"
        >
          <GithubLogo size={18} weight="fill" />
          GitHub
          <ArrowSquareOut size={14} />
        </a>
        <a
          href={VIDEO_PAGE}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5"
        >
          <PlayCircle size={18} />
          Watch on Bilibili
        </a>
      </div>

      <div className="mt-10 overflow-hidden rounded-[16px] border border-line bg-raised">
        <div className="relative aspect-video w-full bg-bg">
          <iframe
            title="SynBio Crafter trailer"
            src={VIDEO_EMBED}
            className="absolute inset-0 h-full w-full"
            allow="fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loop.map((step) => (
          <li key={step.title} className="rounded-[16px] bg-surface p-5">
            <p className="text-xl">{step.title}</p>
            <p className="mt-2 text-mute">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-[16px] border border-line bg-surface p-6">
          <h2 className="text-2xl">Install</h2>
          <ul className="mt-4 grid gap-2 text-mute">
            <li>Minecraft 26.1.2</li>
            <li>Fabric Loader 0.18.6 or newer</li>
            <li>Fabric API for 26.1.2</li>
            <li>Java 25 or newer</li>
          </ul>
          <p className="mt-4 text-sm text-mute">
            Put Fabric API and <span className="font-mono text-ink">synbio-1.0.0.jar</span> in{' '}
            <span className="font-mono text-ink">.minecraft/mods/</span>. Build from source with{' '}
            <span className="font-mono text-ink">./gradlew build</span>.
          </p>
        </div>
        <div className="rounded-[16px] border border-line bg-surface p-6">
          <h2 className="text-2xl">Event server</h2>
          {config.minecraft_server_address ? (
            <>
              <p className="mt-4 text-sm text-mute">Join address</p>
              <p className="mt-2 font-mono text-2xl">{config.minecraft_server_address}</p>
            </>
          ) : (
            <p className="mt-4 text-mute">
              This page does not connect to a Minecraft server. Download the mod from GitHub, or ask
              event staff for a live server IP if one is running.
            </p>
          )}
          {config.minecraft_info ? (
            <p className="mt-4 whitespace-pre-wrap text-mute">{config.minecraft_info}</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
