import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Crown, Car, Heart, Plane, Users, Briefcase, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

const eventServices = [
  { icon: Heart, label: "Nikahan" },
  { icon: Plane, label: "Shuttle Bandara" },
  { icon: Users, label: "Kunjungan Keluarga" },
  { icon: Briefcase, label: "Kunjungan Dinas" },
  { icon: MapPin, label: "Carter Drop" },
  { icon: Sparkles, label: "Private Wisata" },
];

const fleets = [
  { name: "Avanza", capacity: "6 Seat" },
  { name: "All New Xenia", capacity: "6 Seat" },
  { name: "Innova Reborn", capacity: "6 Seat" },
  { name: "Hiace Commuter/Premio", capacity: "14 Seat" },
  { name: "Elf Long", capacity: "19 Seat" },
];

const PremiumServices = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".premium-title", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".premium-card", {
        scrollTrigger: {
          trigger: ".premium-grid",
          start: "top 85%",
        },
        y: 50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
        clearProps: "all",
      });

      gsap.from(".event-badge", {
        scrollTrigger: {
          trigger: ".events-container",
          start: "top 90%",
        },
        scale: 0.8,
        opacity: 0,
        duration: 0.4,
        stagger: 0.08,
        ease: "back.out(1.7)",
      });

      gsap.from(".fleet-item", {
        scrollTrigger: {
          trigger: ".fleet-container",
          start: "top 90%",
        },
        x: -30,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

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

        <div className="premium-grid grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Support Acara Card */}
          <div className="premium-card bg-card rounded-xl md:rounded-2xl p-5 md:p-6 lg:p-8 border border-border shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Car className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display text-base md:text-xl font-bold text-foreground">Support Acara</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Layanan untuk berbagai kebutuhan</p>
              </div>
            </div>

            <div className="events-container grid grid-cols-2 gap-2 md:gap-3">
              {eventServices.map((service, index) => (
                <div
                  key={index}
                  className="event-badge flex items-center gap-1.5 md:gap-2 p-2 md:p-3 bg-secondary/50 rounded-lg md:rounded-xl hover:bg-secondary transition-colors cursor-default"
                >
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <service.icon className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-foreground truncate">{service.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ready Armada Card */}
          <div className="premium-card bg-card rounded-xl md:rounded-2xl p-5 md:p-6 lg:p-8 border border-border shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-display text-base md:text-xl font-bold text-foreground">Ready Armada</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Pilihan kendaraan lengkap</p>
              </div>
            </div>

            <div className="fleet-container space-y-2 md:space-y-3">
              {fleets.map((fleet, index) => (
                <div
                  key={index}
                  className="fleet-item flex items-center justify-between p-3 md:p-4 bg-secondary/50 rounded-lg md:rounded-xl hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-md md:rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Car className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground text-sm md:text-base">{fleet.name}</span>
                  </div>
                  <span className="text-xs md:text-sm text-muted-foreground bg-background px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                    {fleet.capacity}
                  </span>
                </div>
              ))}
            </div>
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
