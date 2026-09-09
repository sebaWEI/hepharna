import { ArrowSquareOut, Cube, GithubLogo, PlayCircle } from '@phosphor-icons/react'
import { useLocale } from '../context/LocaleContext'
import { useChallengeConfig } from '../hooks/useChallengeConfig'

const MOD_REPO = 'https://github.com/sebaWEI/PekingHSC2026MinecraftMod'
const VIDEO_PAGE = 'https://www.bilibili.com/video/BV1ShRcBpETA'
const VIDEO_EMBED =
  'https://player.bilibili.com/player.html?bvid=BV1ShRcBpETA&page=1&high_quality=1&danmaku=0&as_wide=1'

export function MinecraftPage() {
  const { config } = useChallengeConfig()
  const { t } = useLocale()
  const loop = [
    { title: t('mc.collect'), body: t('mc.collectBody') },
    { title: t('mc.identify'), body: t('mc.identifyBody') },
    { title: t('mc.assemble'), body: t('mc.assembleBody') },
    { title: t('mc.transform'), body: t('mc.transformBody') },
    { title: t('mc.express'), body: t('mc.expressBody') },
    { title: t('mc.enhance'), body: t('mc.enhanceBody') },
  ]
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
      <p className="inline-flex items-center gap-2 font-mono text-sm tracking-[0.2em] text-accent">
        <Cube size={18} />
        {t('mc.kicker')}
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl md:text-6xl">{t('mc.title')}</h1>
      <p className="mt-3 text-xl text-mute">{t('mc.subtitle')}</p>
      <p className="mt-4 max-w-[52ch] text-lg text-mute">{t('mc.body')}</p>
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
          {t('mc.watch')}
        </a>
      </div>

      <div className="mt-10 overflow-hidden rounded-[16px] border border-line bg-raised">
        <div className="relative aspect-video w-full bg-bg">
          <iframe
            title={t('mc.trailer')}
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
          <h2 className="text-2xl">{t('mc.install')}</h2>
          <ul className="mt-4 grid gap-2 text-mute">
            <li>Minecraft 26.1.2</li>
            <li>Fabric Loader 0.18.6 or newer</li>
            <li>Fabric API for 26.1.2</li>
            <li>Java 25 or newer</li>
          </ul>
          <p className="mt-4 text-sm text-mute">{t('mc.installHint')}</p>
        </div>
        <div className="rounded-[16px] border border-line bg-surface p-6">
          <h2 className="text-2xl">{t('mc.server')}</h2>
          {config.minecraft_server_address ? (
            <>
              <p className="mt-4 text-sm text-mute">{t('mc.join')}</p>
              <p className="mt-2 font-mono text-2xl">{config.minecraft_server_address}</p>
            </>
          ) : (
            <p className="mt-4 text-mute">{t('mc.noServer')}</p>
          )}
          {config.minecraft_info ? (
            <p className="mt-4 whitespace-pre-wrap text-mute">{config.minecraft_info}</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
