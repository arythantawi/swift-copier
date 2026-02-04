import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HeroBanner from '@/components/HeroBanner';
import PromoSection from '@/components/PromoSection';
import Services from '@/components/Services';
import StatsCounter from '@/components/StatsCounter';
import Facilities from '@/components/Facilities';
import PopularRoutes from '@/components/PopularRoutes';

import VideoSection from '@/components/VideoSection';
import PremiumServices from '@/components/PremiumServices';
import Features from '@/components/Features';
import Testimonials from '@/components/Testimonials';
import InstagramGallery from '@/components/InstagramGallery';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';


gsap.registerPlugin(ScrollTrigger);

const Index = () => {
  useEffect(() => {
    // Smooth scroll for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', handleAnchorClick as EventListener);
    });

    return () => {
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.removeEventListener('click', handleAnchorClick as EventListener);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <HeroBanner />
        <PromoSection />
        <Services />
        <StatsCounter />
        <Facilities />
        <section id="rute">
          <PopularRoutes />
        </section>
        
        <VideoSection />
        <PremiumServices />
        <Features />
        <Testimonials />
        <InstagramGallery />
        <FAQSection />
      </main>
      <Footer />
      <WhatsAppFloat />
      
    </div>
  );
};

export default Index;
