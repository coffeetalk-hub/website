import { Reveal } from './Reveal'

interface Props {
  eyebrow?: string
  title: string
  subhead?: string
  align?: 'center' | 'start'
  tone?: 'light' | 'dark'
  id?: string
}

export function SectionHeading({ eyebrow, title, subhead, align = 'center', tone = 'light', id }: Props) {
  const alignCls = align === 'center' ? 'mx-auto text-center' : 'text-start'
  const titleCls = tone === 'dark' ? 'text-cream-50' : 'text-espresso-900'
  const subCls = tone === 'dark' ? 'text-cream-200/80' : 'text-espresso-500'
  return (
    <Reveal className={`max-w-2xl ${alignCls}`}>
      {eyebrow && <p className={`eyebrow ${tone === 'dark' ? 'text-copper-300' : ''}`}>{eyebrow}</p>}
      <h2
        id={id}
        className={`mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1] ${titleCls}`}
      >
        {title}
      </h2>
      {subhead && <p className={`mt-4 text-lg text-pretty ${subCls}`}>{subhead}</p>}
    </Reveal>
  )
}
