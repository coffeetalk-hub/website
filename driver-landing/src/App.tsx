import { Header } from './components/sections/Header'
import { Hero } from './components/sections/Hero'
import { Themes } from './components/sections/Themes'
import { HowItWorks } from './components/sections/HowItWorks'
import { Earnings } from './components/sections/Earnings'
import { Safety } from './components/sections/Safety'
import { Requirements } from './components/sections/Requirements'
import { Faq } from './components/sections/Faq'
import { FinalCta } from './components/sections/FinalCta'
import { Footer } from './components/sections/Footer'
import { WaitlistProvider } from './components/sections/WaitlistForm'
import { useInPageLinks } from './lib/useInPageLinks'

export default function App() {
  useInPageLinks()
  return (
    <WaitlistProvider>
      <Header />
      <main id="main">
        <Hero />
        <Themes />
        <HowItWorks />
        <Earnings />
        <Safety />
        <Requirements />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </WaitlistProvider>
  )
}
