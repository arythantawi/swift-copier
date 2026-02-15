import { useEffect, useRef, forwardRef } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import logo44Trans from "@/assets/logo-44trans.png";
gsap.registerPlugin(ScrollTrigger);

const Footer = forwardRef<HTMLElement>((_, ref) => {
  const footerRef = useRef<HTMLElement>(null);
  const currentYear = new Date().getFullYear();

  const routes = [
    "Surabaya - Denpasar",
    "Malang - Denpasar",
    "Surabaya - Jakarta",
    "Surabaya - Jogja",
    "Surabaya - Malang",
    "Surabaya - Banyuwangi",
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".footer-content > div", {
        scrollTrigger: { trigger: footerRef.current, start: "top 90%" },
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });
    }, footerRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={ref || footerRef} id="kontak" className="relative bg-foreground text-background overflow-hidden">
      {/* Gradient top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

      {/* Decorative blurs */}
      <div className="absolute top-20 -left-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />

      <div className="container px-4 sm:px-6 py-14 md:py-20 relative z-10">
        <div className="footer-content grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14">

          {/* Left Column: Brand + Map */}
          <div className="lg:col-span-5 space-y-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl border-2 border-primary/30 bg-white/90 p-1 shadow-lg flex-shrink-0">
                  <img src={logo44Trans} alt="44 Trans Jawa Bali" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <span className="font-display font-bold text-xl text-background tracking-tight">44 TRANS</span>
                  <p className="text-xs text-background/40 font-medium tracking-widest uppercase">Jawa & Bali</p>
                </div>
              </div>
              <p className="text-background/50 text-sm leading-relaxed max-w-sm">
                Layanan travel minibus profesional untuk perjalanan nyaman dan aman ke berbagai kota di Jawa dan Bali.
              </p>
            </div>

            {/* Social Buttons */}
            <div className="flex flex-wrap gap-2">
              <a href="#" className="group flex items-center gap-2 px-4 py-2 rounded-full border border-background/10 bg-background/5 hover:bg-[#E1306C] hover:border-[#E1306C] transition-all duration-300 text-sm text-background/60 hover:text-white" aria-label="Instagram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                Instagram
              </a>
              <a href="#" className="group flex items-center gap-2 px-4 py-2 rounded-full border border-background/10 bg-background/5 hover:bg-[#0163E0] hover:border-[#0163E0] transition-all duration-300 text-sm text-background/60 hover:text-white" aria-label="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.03998C6.5 2.03998 2 6.52998 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.84998C10.44 7.33998 11.93 5.95998 14.22 5.95998C15.31 5.95998 16.45 6.14998 16.45 6.14998V8.61998H15.19C13.95 8.61998 13.56 9.38998 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C15.9164 21.5878 18.0622 20.3855 19.6099 18.57C21.1576 16.7546 22.0054 14.4456 22 12.06C22 6.52998 17.5 2.03998 12 2.03998Z" /></svg>
                Facebook
              </a>
              <a href="https://wa.me/6281233330042" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-4 py-2 rounded-full border border-background/10 bg-background/5 hover:bg-[#25D366] hover:border-[#25D366] transition-all duration-300 text-sm text-background/60 hover:text-white" aria-label="WhatsApp">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                WhatsApp
              </a>
            </div>

            {/* Location Card: Address + Map unified */}
            <div className="relative rounded-2xl overflow-hidden border border-background/10 shadow-2xl shadow-black/20 bg-background/5">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d247.3130409595236!2d112.71901594474912!3d-7.352923214642894!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7e4abc47489bb%3A0xb0ea2c2f0b20a3d4!2sJl.%20Letjend%20Sutoyo%20No.107%2C%20Bungur%2C%20Medaeng%2C%20Kec.%20Waru%2C%20Kabupaten%20Sidoarjo%2C%20Jawa%20Timur%2061256!5e0!3m2!1sid!2sid!4v1771153387255!5m2!1sid!2sid"
                className="w-full h-44 sm:h-52 grayscale hover:grayscale-0 transition-all duration-700"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi Kantor 44 Trans"
              />
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#f59f0a' }}>Kantor Pusat</p>
                  <p className="text-background/65 text-xs leading-relaxed">
                    Jl. Letjend Sutoyo No.107, Bungur, Medaeng, Kec. Waru, Kab. Sidoarjo, Jawa Timur 61256
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Columns */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10">

            {/* Routes */}
            <div>
              <h4 className="font-display font-semibold text-sm uppercase tracking-widest mb-5" style={{ color: '#f59f0a' }}>Rute Populer</h4>
              <ul className="space-y-3">
                {routes.map((route) => (
                  <li key={route}>
                    <a href="#" className="text-background/60 text-sm hover:text-accent transition-colors flex items-center gap-2 group">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-accent transition-colors flex-shrink-0" />
                      <span>{route}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h4 className="font-display font-semibold text-sm uppercase tracking-widest mb-5" style={{ color: '#f59f0a' }}>Jam Operasional</h4>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background/5 border border-background/8">
                  <p className="text-xs mb-1" style={{ color: '#f59f0a' }}>Senin – Jumat</p>
                  <p className="text-background font-semibold text-lg tracking-tight">06:00 – 22:00</p>
                </div>
                <div className="p-4 rounded-xl bg-background/5 border border-background/8">
                  <p className="text-xs mb-1" style={{ color: '#f59f0a' }}>Sabtu – Minggu</p>
                  <p className="text-background font-semibold text-lg tracking-tight">07:00 – 21:00</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-bold text-accent uppercase tracking-wider">Hotline 24 Jam</span>
                  </div>
                  <p className="text-xs text-background/50">Informasi & bantuan darurat</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display font-semibold text-sm uppercase tracking-widest mb-5" style={{ color: '#f59f0a' }}>Kontak</h4>
              <div className="space-y-5">
                <a href="tel:+6281233330042" className="flex items-start gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-background/35 uppercase tracking-wider font-medium">Telepon / WA</p>
                    <p className="text-background text-sm font-semibold group-hover:text-accent transition-colors">+62 812-3333-0042</p>
                  </div>
                </a>
                <a href="mailto:info@travelminibus.com" className="flex items-start gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-background/35 uppercase tracking-wider font-medium">Email</p>
                    <p className="text-background text-sm font-semibold group-hover:text-accent transition-colors">info@travelminibus.com</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/8">
        <div className="container px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-background/30 text-xs">
            © {currentYear} 44 Trans Jawa Bali. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs">
            <a href="#" className="text-background/40 hover:text-accent transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="text-background/40 hover:text-accent transition-colors">Kebijakan Privasi</a>
            <button onClick={scrollToTop} className="w-9 h-9 rounded-xl bg-background/5 border border-background/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all" aria-label="Kembali ke atas">
              <ArrowUpRight className="w-4 h-4 -rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
export default Footer;