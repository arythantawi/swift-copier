import { useState, useEffect, useRef, forwardRef, useMemo } from 'react';
import { useFaqs } from '@/hooks/useSiteData';
import { 
  HelpCircle, 
  MessageCircle, 
  ChevronRight, 
  ArrowLeft, 
  Search,
  CreditCard,
  MapPin,
  Clock,
  Ticket,
  Car,
  Users,
  Shield,
  Package,
  Phone,
  Settings,
  Info,
  LucideIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Typewriter } from '@/hooks/use-typewriter';

gsap.registerPlugin(ScrollTrigger);

// Category icon mapping
const categoryIcons: Record<string, LucideIcon> = {
  'Pembayaran': CreditCard,
  'Payment': CreditCard,
  'Rute': MapPin,
  'Route': MapPin,
  'Lokasi': MapPin,
  'Location': MapPin,
  'Jadwal': Clock,
  'Schedule': Clock,
  'Waktu': Clock,
  'Tiket': Ticket,
  'Ticket': Ticket,
  'Booking': Ticket,
  'Pemesanan': Ticket,
  'Kendaraan': Car,
  'Vehicle': Car,
  'Armada': Car,
  'Penumpang': Users,
  'Passenger': Users,
  'Keamanan': Shield,
  'Security': Shield,
  'Bagasi': Package,
  'Luggage': Package,
  'Barang': Package,
  'Kontak': Phone,
  'Contact': Phone,
  'Layanan': Settings,
  'Service': Settings,
  'Umum': Info,
  'General': Info,
};

const getCategoryIcon = (category: string): LucideIcon => {
  // Check exact match first
  if (categoryIcons[category]) return categoryIcons[category];
  
  // Check if category contains any keyword
  const lowerCategory = category.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerCategory.includes(key.toLowerCase())) {
      return icon;
    }
  }
  
  return HelpCircle; // Default icon
};

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

type ViewState = 'categories' | 'questions' | 'answer';

const FAQSection = forwardRef<HTMLElement>((_, ref) => {
  const { faqs, isLoading } = useFaqs();
  const [showDescription, setShowDescription] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Filter FAQs based on search query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [faqs, searchQuery]);

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || 'Umum';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const categories = Object.keys(groupedFaqs);

  // Animate content when view changes
  useEffect(() => {
    if (contentRef.current && isOpen) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [viewState, selectedCategory, selectedFaq, isOpen]);

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

      gsap.from('.faq-cta-button', {
        scrollTrigger: {
          trigger: '.faq-cta-button',
          start: 'top 90%',
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [faqs.length]);

  const handleOpenDialog = () => {
    setIsOpen(true);
    setViewState('categories');
    setSelectedCategory(null);
    setSelectedFaq(null);
    setSearchQuery('');
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setViewState('questions');
  };

  const handleSelectQuestion = (faq: FAQ) => {
    setSelectedFaq(faq);
    setViewState('answer');
  };

  const handleBack = () => {
    if (viewState === 'answer') {
      setViewState('questions');
      setSelectedFaq(null);
    } else if (viewState === 'questions') {
      setViewState('categories');
      setSelectedCategory(null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setViewState('categories');
      setSelectedCategory(null);
      setSelectedFaq(null);
      setSearchQuery('');
    }, 300);
  };

  const handleSearchSelect = (faq: FAQ) => {
    setSelectedFaq(faq);
    setSelectedCategory(faq.category || 'Umum');
    setViewState('answer');
    setSearchQuery('');
  };

  if (isLoading || faqs.length === 0) return null;

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
          <p className="text-muted-foreground max-w-2xl mx-auto min-h-[2rem] text-sm md:text-base mb-8">
            {showDescription && (
              <Typewriter
                text="Temukan jawaban untuk pertanyaan umum tentang layanan travel kami"
                speed={25}
                showCursor={false}
              />
            )}
          </p>

          {/* CTA Button */}
          <Button
            onClick={handleOpenDialog}
            className="faq-cta-button bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground gap-2 px-6 md:px-8 py-5 md:py-6 text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Search className="w-5 h-5" />
            Cari Jawaban
          </Button>
        </div>

        {/* FAQ Dialog */}
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden border-0 shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5 md:px-8 md:py-6">
              <DialogHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  {viewState !== 'categories' && (
                    <button
                      onClick={handleBack}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <DialogTitle className="text-lg md:text-xl font-bold text-white leading-relaxed pr-8">
                    {viewState === 'categories' && 'Pilih Kategori'}
                    {viewState === 'questions' && selectedCategory}
                    {viewState === 'answer' && selectedFaq?.question}
                  </DialogTitle>
                </div>

                {/* Category Badges */}
                {viewState === 'categories' && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {categories.map((category) => {
                      const IconComponent = getCategoryIcon(category);
                      return (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="bg-white/20 text-white border-white/30 hover:bg-white/30 cursor-pointer transition-all duration-200 px-3 py-1.5 gap-1.5"
                          onClick={() => handleSelectCategory(category)}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                          {category}
                          <span className="ml-1 text-xs opacity-80">
                            ({groupedFaqs[category].length})
                          </span>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Current Category Badge */}
                {(viewState === 'questions' || viewState === 'answer') && selectedCategory && (
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30 w-fit gap-1.5"
                  >
                    {(() => {
                      const IconComponent = getCategoryIcon(selectedCategory);
                      return <IconComponent className="w-3.5 h-3.5" />;
                    })()}
                    {selectedCategory}
                  </Badge>
                )}
              </DialogHeader>
            </div>

            {/* Content */}
            <div className="bg-background" ref={contentRef}>
              {/* Search Input */}
              {viewState === 'categories' && (
                <div className="px-6 pt-4 md:px-8">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari pertanyaan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-muted/50 border-border focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <ScrollArea className="max-h-[50vh]">
                <div className="px-6 py-6 md:px-8 md:py-8">
                  {/* Search Results */}
                  {viewState === 'categories' && searchQuery.trim() && (
                    <div className="space-y-2">
                      {filteredFaqs.length > 0 ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-4">
                            Ditemukan {filteredFaqs.length} hasil untuk "{searchQuery}"
                          </p>
                          {filteredFaqs.map((faq) => {
                            const IconComponent = getCategoryIcon(faq.category || 'Umum');
                            return (
                              <button
                                key={faq.id}
                                onClick={() => handleSearchSelect(faq)}
                                className="w-full text-left bg-card hover:bg-muted/50 rounded-xl px-5 py-4 transition-all duration-200 group border border-border hover:border-primary/30 hover:shadow-md"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <IconComponent className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-foreground text-sm md:text-base block">
                                      {faq.question}
                                    </span>
                                    <span className="text-xs text-muted-foreground mt-1 block">
                                      {faq.category || 'Umum'}
                                    </span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-2" />
                                </div>
                              </button>
                            );
                          })}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <HelpCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            Tidak ada hasil untuk "{searchQuery}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Categories View */}
                  {viewState === 'categories' && !searchQuery.trim() && (
                    <div className="space-y-3">
                      {categories.map((category) => {
                        const IconComponent = getCategoryIcon(category);
                        return (
                          <button
                            key={category}
                            onClick={() => handleSelectCategory(category)}
                            className="w-full text-left bg-muted/50 hover:bg-muted rounded-xl px-5 py-4 transition-all duration-200 group border border-transparent hover:border-primary/20 hover:shadow-md"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                  <IconComponent className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <span className="font-semibold text-foreground">
                                    {category}
                                  </span>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {groupedFaqs[category].length} pertanyaan
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Questions View */}
                  {viewState === 'questions' && selectedCategory && (
                    <div className="space-y-2">
                      {groupedFaqs[selectedCategory].map((faq, index) => (
                        <button
                          key={faq.id}
                          onClick={() => handleSelectQuestion(faq)}
                          className="w-full text-left bg-card hover:bg-muted/50 rounded-xl px-5 py-4 transition-all duration-200 group border border-border hover:border-primary/30 hover:shadow-md"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-medium text-foreground text-sm md:text-base">
                              {faq.question}
                            </span>
                            <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Answer View */}
                  {viewState === 'answer' && selectedFaq && (
                    <div className="prose prose-sm md:prose-base max-w-none">
                      <p className="text-foreground/80 leading-[1.8] md:leading-[1.9] text-sm md:text-base whitespace-pre-wrap">
                        {selectedFaq.answer}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="border-t border-border px-6 py-4 md:px-8 md:py-5 bg-muted/30">
                <div className="flex items-center justify-between">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {viewState === 'answer' ? 'Butuh bantuan lebih?' : 'Tidak menemukan jawaban?'}
                  </p>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    onClick={() => {
                      handleClose();
                      window.open('https://wa.me/6281233330042', '_blank');
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Hubungi Kami</span>
                    <span className="sm:hidden">Chat</span>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
});

FAQSection.displayName = 'FAQSection';

export default FAQSection;
