import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

export function LandingPage() {
  const { user } = useAuth()
  const { t } = useLocale()
  const steps = [t('landing.step1'), t('landing.step2'), t('landing.step3'), t('landing.step4'), t('landing.step5')]
  return (
    <section className="landing-page mx-auto grid min-h-[calc(100dvh-11rem)] max-w-7xl items-center gap-12 px-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
      <div className="landing-copy">
        <p className="font-mono text-xs tracking-[0.24em] text-accent">{t('landing.kicker')}</p>
        <h1 className="landing-title mt-5">{t('landing.title')}</h1>
        <p className="landing-tagline mt-6 text-ink">{t('landing.tagline')}</p>
        <p className="landing-description mt-4 text-mute">{t('landing.body')}</p>
        <div className="landing-actions flex flex-wrap gap-3">
          <Link to={user ? '/challenge' : '/register'} className="action-link rounded-full bg-accent text-bg">
            {t('landing.join')}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link to="/leaderboard" className="action-link rounded-full border border-line">
            {t('landing.board')}
          </Link>
        </div>
        <Link to="/minecraft" className="mt-6 inline-flex items-center gap-2 text-sm text-mute hover:text-accent">
          {t('nav.minecraft')}<ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <div className="process-panel">
        <h2 className="process-heading">{t('landing.how')}</h2>
        <ol className="process-list">
          {steps.map((step, index) => (
            <li className="process-step" key={index}>
              <span className="process-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span className="process-label">{step}</span>
            </li>
          ))}
        </ol>
        <p className="process-sequence font-mono text-base-a" aria-hidden="true">
          AUGCCAGU <span className="text-base-u">CCAGUACG</span>{' '}
          <span className="text-base-g">AUCGAUGC</span> <span className="text-base-c">CAGUAC</span>
        </p>
      </div>
    </section>
  )
}
