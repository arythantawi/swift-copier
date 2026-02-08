import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram, Sparkles, ExternalLink } from 'lucide-react';
import { SectionBadge, GlowButton, IconBox } from '@/components/atoms';
import { SectionHeader } from '@/components/molecules';
import { SectionWrapper } from '@/components/templates';

gsap.registerPlugin(ScrollTrigger);

const InstagramGallery = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLDivElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Floating decoration animation
      if (decorRef.current) {
        const floatingElements = decorRef.current.querySelectorAll('.floating-decor');
        floatingElements.forEach((el, i) => {
          gsap.to(el, {
            y: -20,
            duration: 2 + i * 0.3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        });
      }

      // Header animation with stagger
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { y: 50, opacity: 0, rotateX: -15 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }

      // Iframe container animation with 3D effect
      if (iframeRef.current) {
        gsap.fromTo(
          iframeRef.current,
          { y: 80, opacity: 0, scale: 0.9, rotateY: -5 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotateY: 0,
            duration: 1.2,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: iframeRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-28 lg:py-32 overflow-hidden"
    >
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-primary/5" />
      
      {/* Decorative floating elements */}
      <div ref={decorRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="floating-decor absolute top-20 left-[10%] w-20 h-20 rounded-full bg-primary/10 blur-2xl" />
        <div className="floating-decor absolute top-40 right-[15%] w-32 h-32 rounded-full bg-accent/20 blur-3xl" />
        <div className="floating-decor absolute bottom-32 left-[20%] w-24 h-24 rounded-full bg-secondary/30 blur-2xl" />
        <div className="floating-decor absolute bottom-20 right-[10%] w-16 h-16 rounded-full bg-primary/15 blur-xl" />
      </div>

      <div className="container relative mx-auto px-4">
        {/* Atomic Header using molecules */}
        <div ref={headerRef} className="text-center mb-12 md:mb-16" style={{ perspective: '1000px' }}>
          <SectionBadge icon={Sparkles} iconPosition="both" variant="glow" className="mb-6">
            @44transjawabali
          </SectionBadge>
          
          <SectionHeader
            title="Ikuti Kami di Instagram"
            titleGradient
            titleSize="lg"
            description="Lihat momen perjalanan terbaik, promo eksklusif, dan update terbaru dari 44 Trans"
            align="center"
          />
        </div>

        {/* Instagram Embed Container - Glass morphism style */}
        <div
          ref={iframeRef}
          className="relative w-full max-w-5xl mx-auto"
          style={{ perspective: '1000px' }}
        >
          {/* Outer glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 rounded-3xl blur-xl opacity-50" />
          
          {/* Main container with glass effect */}
          <div className="relative rounded-3xl overflow-hidden bg-card/80 backdrop-blur-sm border border-border/50 shadow-2xl shadow-primary/10">
            {/* Top bar - mimics app header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-muted/80 to-muted/40 border-b border-border/30">
              <div className="flex items-center gap-3">
                <IconBox icon={Instagram} variant="gradient" size="md" />
                <div>
                  <p className="font-bold text-foreground text-sm md:text-base">44transjawabali</p>
                  <p className="text-xs text-muted-foreground">Travel & Transportation</p>
                </div>
              </div>
              <a
                href="https://www.instagram.com/44transjawabali"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
              >
                Follow
              </a>
            </div>
            
            {/* Responsive iframe wrapper */}
            <div className="relative w-full overflow-hidden bg-background/50">
              {/* Mobile: Square aspect ratio */}
              <div className="block sm:hidden w-full" style={{ paddingBottom: '100%', position: 'relative' }}>
                <iframe
                  src="https://snapwidget.com/embed/1117542"
                  className="absolute inset-0 w-full h-full"
                  allowTransparency={true}
                  frameBorder="0"
                  scrolling="no"
                  title="Posts from Instagram"
                  style={{ border: 'none', overflow: 'hidden' }}
                />
              </div>
              
              {/* Tablet: 4:3 aspect ratio */}
              <div className="hidden sm:block lg:hidden w-full" style={{ paddingBottom: '75%', position: 'relative' }}>
                <iframe
                  src="https://snapwidget.com/embed/1117542"
                  className="absolute inset-0 w-full h-full"
                  allowTransparency={true}
                  frameBorder="0"
                  scrolling="no"
                  title="Posts from Instagram"
                  style={{ border: 'none', overflow: 'hidden' }}
                />
              </div>
              
              {/* Desktop: 16:10 aspect ratio */}
              <div className="hidden lg:block w-full" style={{ paddingBottom: '56%', position: 'relative' }}>
                <iframe
                  src="https://snapwidget.com/embed/1117542"
                  className="absolute inset-0 w-full h-full"
                  allowTransparency={true}
                  frameBorder="0"
                  scrolling="no"
                  title="Posts from Instagram"
                  style={{ border: 'none', overflow: 'hidden' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA using atomic button */}
        <div className="text-center mt-10 md:mt-14 space-y-4">
          <GlowButton
            href="https://www.instagram.com/44transjawabali"
            icon={ExternalLink}
            iconPosition="right"
            variant="primary"
            size="lg"
          >
            <Instagram className="w-5 h-5 mr-1" />
            Kunjungi Instagram Kami
          </GlowButton>
          
          <p className="text-sm text-muted-foreground">
            Follow untuk promo & info terbaru
          </p>
        </div>
      </div>
    </section>
  );
};

export default InstagramGallery;
