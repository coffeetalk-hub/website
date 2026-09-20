import { Header } from './components/sections/Header'
import { Hero } from './components/sections/Hero'
import { Why } from './components/sections/Why'
import { Signature } from './components/sections/Signature'
import { HowItWorks } from './components/sections/HowItWorks'
import { Shift } from './components/sections/Shift'
import { Pay } from './components/sections/Pay'
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
        <Why />
        <Signature />
        <HowItWorks />
        <Shift />
        <Pay />
        <Requirements />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </WaitlistProvider>
  )
}
