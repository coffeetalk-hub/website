import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Differentiators } from './components/Differentiators'
import { HowItWorks } from './components/HowItWorks'
import { AppTour } from './components/AppTour'
import { ForCafes } from './components/ForCafes'
import { ForDrivers } from './components/ForDrivers'
import { StatsStrip } from './components/StatsStrip'
import { Download } from './components/Download'
import { Footer } from './components/Footer'
import { useInPageLinks } from './useInPageLinks'

export default function App() {
  useInPageLinks()
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Differentiators />
        <HowItWorks />
        <AppTour />
        <ForCafes />
        <ForDrivers />
        <StatsStrip />
        <Download />
      </main>
      <Footer />
    </>
  )
}
