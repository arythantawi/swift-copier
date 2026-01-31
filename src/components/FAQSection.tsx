import { useState, useEffect, useRef, forwardRef } from 'react';
import { useFaqs } from '@/hooks/useSiteData';
import { HelpCircle, MessageCircle, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Typewriter } from '@/hooks/use-typewriter';

gsap.registerPlugin(ScrollTrigger);

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

const FAQSection = forwardRef<HTMLElement>((_, ref) => {
  // Use cached data from context instead of fetching directly
  const { faqs, isLoading } = useFaqs();
  const [showDescription, setShowDescription] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (faqs.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from('.faq-title', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        onComplete: () => setShowDescription(true),
      });

      gsap.from('.faq-content', {
        scrollTrigger: {
          trigger: '.faq-content',
          start: 'top 85%',
        },
        y: 50,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
      });

      gsap.from('.faq-cta', {
        scrollTrigger: {
          trigger: '.faq-cta',
          start: 'top 90%',
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
      });

      // Parallax for FAQ content
      gsap.to('.faq-content', {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: '.faq-content',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        }
      });

      // Parallax for CTA
      gsap.to('.faq-cta', {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: '.faq-cta',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [faqs.length]);

  if (isLoading || faqs.length === 0) return null;

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || 'Umum';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <section ref={ref || sectionRef} id="faq" className="py-12 md:py-20 bg-muted/20">
      <div className="container px-4 sm:px-6">
        <div className="faq-title text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-1.5 md:gap-2 bg-primary/10 px-4 md:px-5 py-2 md:py-2.5 rounded-full mb-3 md:mb-4">
            <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-xs md:text-sm font-semibold text-primary">FAQ</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto min-h-[2rem] text-sm md:text-base">
            {showDescription && (
              <Typewriter
                text="Temukan jawaban untuk pertanyaan umum tentang layanan travel kami"
                speed={25}
                showCursor={false}
              />
            )}
          </p>
        </div>

        <div className="faq-content max-w-3xl mx-auto mb-8 md:mb-12">
          {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
            <div key={category} className="mb-8">
              {Object.keys(groupedFaqs).length > 1 && (
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {category}
                </h3>
              )}
              <div className="space-y-2 md:space-y-3">
                {categoryFaqs.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => setSelectedFaq(faq)}
                    className="w-full text-left bg-card rounded-lg md:rounded-xl border border-border px-4 md:px-6 py-4 md:py-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground pr-4 text-sm md:text-base">
                        {faq.question}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Detail Dialog */}
        <Dialog open={!!selectedFaq} onOpenChange={(open) => !open && setSelectedFaq(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl font-bold text-foreground pr-6">
                {selectedFaq?.question}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
              {selectedFaq?.answer}
            </DialogDescription>
          </DialogContent>
        </Dialog>

        {/* CTA Section */}
        <div className="faq-cta text-center">
          <div className="inline-flex flex-col items-center p-6 md:p-8 bg-card rounded-xl md:rounded-2xl border border-border shadow-lg">
            <p className="text-foreground font-medium mb-3 md:mb-4 text-sm md:text-base">
              Tidak menemukan jawaban yang Anda cari?
            </p>
            <Button 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground gap-2 px-5 md:px-6 py-4 md:py-5 text-sm md:text-base"
              onClick={() => window.open('https://wa.me/6281233330042', '_blank')}
            >
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
              Hubungi Kami
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
});

FAQSection.displayName = 'FAQSection';

export default FAQSection;
