import { Reveal } from './Reveal'

interface Props {
  id: string
  eyebrow: string
  title: string
  subhead?: string
  tone?: 'dark' | 'cream'
  align?: 'start' | 'center'
}

export function SectionHeading({ id, eyebrow, title, subhead, tone = 'dark', align = 'start' }: Props) {
  const onCream = tone === 'cream'
  return (
    <Reveal className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      <p className={`eyebrow ${onCream ? 'eyebrow-on-cream' : ''}`}>{eyebrow}</p>
      <h2
        id={id}
        className={`mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.6rem] lg:leading-[1.15] ${
          onCream ? 'text-espresso-900' : 'text-cream-50'
        }`}
      >
        {title}
      </h2>
      {subhead && (
        <p className={`mt-4 text-lg text-pretty ${onCream ? 'text-espresso-500' : 'text-sand-400'}`}>{subhead}</p>
      )}
    </Reveal>
  )
}
