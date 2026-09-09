import { useLocale } from '../context/LocaleContext'

export function LanguageToggle() {
  const { locale, setLocale } = useLocale()
  return (
    <div className="inline-flex rounded-full border border-line p-0.5 text-xs" role="group" aria-label="Language">
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`rounded-full px-2.5 py-1 ${locale === 'en' ? 'bg-accent text-bg' : 'text-mute hover:text-ink'}`}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('zh')}
        className={`rounded-full px-2.5 py-1 ${locale === 'zh' ? 'bg-accent text-bg' : 'text-mute hover:text-ink'}`}
        aria-pressed={locale === 'zh'}
      >
        中文
      </button>
    </div>
  )
}
