import { useLocale } from '../context/LocaleContext'

export function ForbiddenPage() {
  const { t } = useLocale()
  return (
    <section className="mx-auto max-w-xl px-4 py-24">
      <h1 className="text-4xl">{t('forbidden.title')}</h1>
      <p className="mt-4 text-mute">{t('forbidden.body')}</p>
    </section>
  )
}
