import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Crown, Car, Heart, Plane, Users, Briefcase, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

gsap.registerPlugin(ScrollTrigger);

const eventServices = [
  { icon: Heart, label: "Nikahan" },
  { icon: Plane, label: "Shuttle Bandara" },
  { icon: Users, label: "Kunjungan Keluarga" },
  { icon: Briefcase, label: "Kunjungan Dinas" },
  { icon: MapPin, label: "Carter Drop" },
  { icon: Sparkles, label: "Private Wisata" },
];

interface FleetVehicle {
  id: string;
  name: string;
  capacity: string;
  image_url: string | null;
  description: string | null;
}

const fallbackFleets = [
  { id: "1", name: "Avanza", capacity: "6 Seat", image_url: null, description: null },
  { id: "2", name: "All New Xenia", capacity: "6 Seat", image_url: null, description: null },
  { id: "3", name: "Innova Reborn", capacity: "6 Seat", image_url: null, description: null },
  { id: "4", name: "Hiace Commuter/Premio", capacity: "14 Seat", image_url: null, description: null },
  { id: "5", name: "Elf Long", capacity: "19 Seat", image_url: null, description: null },
];

const PremiumServices = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [fleets, setFleets] = useState<FleetVehicle[]>(fallbackFleets);

  useEffect(() => {
    const fetchFleets = async () => {
      const { data } = await supabase
        .from('fleet_vehicles')
        .select('id, name, capacity, image_url, description')
        .eq('is_active', true)
        .order('display_order');
      if (data && data.length > 0) setFleets(data);
    };
    fetchFleets();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".premium-title", {
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        y: 40, opacity: 0, duration: 0.8, ease: "power3.out",
      });
      gsap.from(".premium-card", {
        scrollTrigger: { trigger: ".premium-grid", start: "top 85%" },
        y: 50, opacity: 0, duration: 0.6, stagger: 0.15, ease: "power2.out", clearProps: "all",
      });
      gsap.from(".event-badge", {
        scrollTrigger: { trigger: ".events-container", start: "top 90%" },
        scale: 0.8, opacity: 0, duration: 0.4, stagger: 0.08, ease: "back.out(1.7)",
      });
      gsap.from(".fleet-card", {
        scrollTrigger: { trigger: ".fleet-container", start: "top 90%" },
        y: 40, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out",
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [fleets]);

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      "Halo, saya tertarik dengan layanan Premium Class. Mohon informasi lebih lanjut.",
    );
    window.open(`https://wa.me/6281233330042?text=${message}`, "_blank");
  };

  return (
    <section ref={sectionRef} className="py-12 md:py-20 bg-white">
      <div className="container px-4 sm:px-6">
        {/* Header */}
        <div className="premium-title text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-1.5 md:py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 rounded-full text-xs md:text-sm font-semibold mb-3 md:mb-4 border border-amber-500/30">
            <Crown className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Layanan Eksklusif
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">Premium Class</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-lg">
            Sewa mobil dan driver profesional untuk berbagai kebutuhan perjalanan Anda
          </p>
        </div>

        {/* Support Acara */}
        <div className="premium-card bg-card rounded-xl md:rounded-2xl p-5 md:p-6 lg:p-8 border border-border shadow-lg max-w-4xl mx-auto mb-8 md:mb-12">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Car className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display text-base md:text-xl font-bold text-foreground">Support Acara</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Layanan untuk berbagai kebutuhan</p>
            </div>
          </div>
          <div className="events-container grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
            {eventServices.map((service, index) => (
              <div key={index} className="event-badge flex items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-white rounded-lg md:rounded-xl hover:bg-secondary/20 transition-colors cursor-default border border-border">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <service.icon className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                </div>
                <span className="text-xs md:text-sm font-medium text-foreground truncate">{service.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ready Armada - Aesthetic Cards */}
        <div className="premium-card max-w-6xl mx-auto">
          <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8 justify-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-display text-base md:text-xl font-bold text-foreground">Ready Armada</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Pilihan kendaraan lengkap</p>
            </div>
          </div>

          <div className="fleet-container grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {fleets.map((fleet) => (
              <div
                key={fleet.id}
                className="fleet-card group relative bg-card rounded-2xl border border-border overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-gradient-to-br from-muted/80 to-muted overflow-hidden">
                  {fleet.image_url ? (
                    <img
                      src={fleet.image_url}
                      alt={fleet.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3 md:p-4">
                  <h4 className="font-semibold text-foreground text-sm md:text-base leading-tight mb-1 truncate">
                    {fleet.name}
                  </h4>
                  {fleet.description && (
                    <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">{fleet.description}</p>
                  )}
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full">
                    <Users className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-primary">{fleet.capacity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8 md:mt-10">
          <Button onClick={handleWhatsApp} className="btn-gold px-6 md:px-8 py-5 md:py-6 text-sm md:text-lg gap-1.5 md:gap-2">
            <Crown className="w-4 h-4 md:w-5 md:h-5" />
            Hubungi Kami untuk Pemesanan
          </Button>
          <p className="text-xs md:text-sm text-muted-foreground mt-2 md:mt-3">Konsultasi gratis untuk kebutuhan perjalanan Anda</p>
        </div>
      </div>
    </section>
  );
};

export default PremiumServices;
