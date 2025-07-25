import Header from '@/components/header';
import HeroSection from '@/components/sections/hero-section';
import FeaturesSection from '@/components/sections/features-section';
import HowItWorksSection from '@/components/sections/how-it-works-section';
import OrganizationsSection from '@/components/sections/organizations-section';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <div className='min-h-screen bg-background'>
      <Header />

      <main>
        {/* Hero Section */}
        <div className='container mx-auto px-4 max-w-7xl'>
          <HeroSection />
        </div>

        {/* Features Section */}
        <div className='container mx-auto px-4 max-w-7xl'>
          <FeaturesSection />
        </div>

        {/* How It Works Section */}
        <div className='container mx-auto px-4 max-w-7xl'>
          <HowItWorksSection />
        </div>

        {/* Organizations Section */}
        <div className='container mx-auto px-4 max-w-7xl'>
          <OrganizationsSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
