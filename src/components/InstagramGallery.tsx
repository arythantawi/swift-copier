import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const InstagramGallery = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Title animation
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current.children,
          {
            y: 40,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: titleRef.current,
              start: 'top 85%',
              once: true,
            },
          }
        );
      }

      // Iframe container animation
      if (iframeRef.current) {
        gsap.fromTo(
          iframeRef.current,
          {
            y: 60,
            opacity: 0,
            scale: 0.95,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
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
      className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-background to-muted/30"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div ref={titleRef} className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Instagram className="w-4 h-4" />
            <span>Follow Us</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Instagram Gallery
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Ikuti perjalanan kami dan lihat momen-momen terbaik dari layanan 44 Trans
          </p>
        </div>

        {/* Instagram Embed Container */}
        <div
          ref={iframeRef}
          className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-xl bg-card border border-border/50"
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none z-10 opacity-30" />
          
          {/* Responsive iframe wrapper */}
          <div className="relative w-full overflow-hidden">
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
            <div className="hidden lg:block w-full" style={{ paddingBottom: '62.5%', position: 'relative' }}>
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

        {/* Follow CTA */}
        <div className="text-center mt-8">
          <a
            href="https://www.instagram.com/44trans_official"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 hover:bg-primary/90"
          >
            <Instagram className="w-5 h-5" />
            <span>Follow @44trans_official</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default InstagramGallery;
