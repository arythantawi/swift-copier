import { useEffect, useRef, forwardRef } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, MessageCircle, ArrowUpRight, Heart, Search } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import logo44Trans from "@/assets/logo-44trans.png";
gsap.registerPlugin(ScrollTrigger);
const Footer = forwardRef<HTMLElement>((_, ref) => {
  const footerRef = useRef<HTMLElement>(null);
  const currentYear = new Date().getFullYear();
  const routes = ["Surabaya - Denpasar", "Malang - Denpasar", "Surabaya - Jakarta", "Surabaya - Jogja", "Surabaya - Malang", "Surabaya - Banyuwangi"];
  const serviceHours = [{
    day: "Senin - Jumat",
    hours: "06:00 - 22:00"
  }, {
    day: "Sabtu - Minggu",
    hours: "07:00 - 21:00"
  }];
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax for footer content
      gsap.from(".footer-content > div", {
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 90%"
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      });
    }, footerRef);
    return () => ctx.revert();
  }, []);
  return <footer ref={ref || footerRef} id="kontak" className="bg-foreground text-background relative">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="container px-4 sm:px-6 py-12 md:py-16 lg:py-20">
        <div className="footer-content grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-primary/50 bg-white/90 p-0.5 shadow-sm flex-shrink-0">
                <img src={logo44Trans} alt="44 Trans Jawa Bali" className="w-full h-full object-contain rounded-full" />
              </div>
              <span className="font-display font-bold text-lg md:text-xl text-background">44 TRANS JAWA BALI</span>
            </div>
            <p className="text-background/60 text-sm mb-6 md:mb-8 leading-relaxed">
              Layanan travel minibus profesional untuk perjalanan nyaman dan aman ke berbagai kota di Jawa dan Bali.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {/* Instagram */}
              <a href="#" className="relative px-2 py-1 sm:px-3 sm:py-1.5 flex items-center text-xs sm:text-sm font-semibold cursor-pointer border border-[#E1306C] rounded-full overflow-hidden text-[#E1306C] transition-colors duration-300 ease-out hover:text-white hover:border-[#E1306C] group" aria-label="Instagram">
                <span className="absolute inset-0 m-auto rounded-full w-[20em] h-[20em] -left-[5em] transition-shadow duration-500 ease-out z-0 group-hover:shadow-[inset_0_0_0_10em_#E1306C]" />
                <svg className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 fill-[#E1306C] group-hover:fill-current transition-colors flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span className="relative z-10 ml-1.5 sm:ml-2">Instagram</span>
              </a>
              
              {/* Facebook */}
              <a href="#" className="relative px-2 py-1 sm:px-3 sm:py-1.5 flex items-center text-xs sm:text-sm font-semibold cursor-pointer border border-[#0163E0] rounded-full overflow-hidden text-[#0163E0] transition-colors duration-300 ease-out hover:text-white hover:border-[#0163E0] group" aria-label="Facebook">
                <span className="absolute inset-0 m-auto rounded-full w-[20em] h-[20em] -left-[5em] transition-shadow duration-500 ease-out z-0 group-hover:shadow-[inset_0_0_0_10em_#0163E0]" />
                <svg className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 fill-[#0163E0] group-hover:fill-current transition-colors flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.03998C6.5 2.03998 2 6.52998 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.84998C10.44 7.33998 11.93 5.95998 14.22 5.95998C15.31 5.95998 16.45 6.14998 16.45 6.14998V8.61998H15.19C13.95 8.61998 13.56 9.38998 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C15.9164 21.5878 18.0622 20.3855 19.6099 18.57C21.1576 16.7546 22.0054 14.4456 22 12.06C22 6.52998 17.5 2.03998 12 2.03998Z" />
                </svg>
                <span className="relative z-10 ml-1.5 sm:ml-2">Facebook</span>
              </a>
              
              {/* WhatsApp */}
              <a href="https://wa.me/6281233330042" target="_blank" rel="noopener noreferrer" className="relative px-2 py-1 sm:px-3 sm:py-1.5 flex items-center text-xs sm:text-sm font-semibold cursor-pointer border border-[#25D366] rounded-full overflow-hidden text-[#25D366] transition-colors duration-300 ease-out hover:text-white hover:border-[#25D366] group" aria-label="WhatsApp">
                <span className="absolute inset-0 m-auto rounded-full w-[20em] h-[20em] -left-[5em] transition-shadow duration-500 ease-out z-0 group-hover:shadow-[inset_0_0_0_10em_#25D366]" />
                <svg className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 fill-[#25D366] group-hover:fill-current transition-colors flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="relative z-10 ml-1.5 sm:ml-2">WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Popular Routes */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Rute Populer</h4>
            <ul className="space-y-3">
              {routes.map(route => <li key={route}>
                  <a href="#" className="text-background/60 text-sm hover:text-accent transition-colors flex items-center gap-2 group">
                    <MapPin className="w-4 h-4 text-primary/60 group-hover:text-accent transition-colors" />
                    <span>{route}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>)}
            </ul>
          </div>

          {/* Service Hours */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Jam Operasional</h4>
            <div className="space-y-4">
              {serviceHours.map(item => <div key={item.day} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center mt-0.5">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-background font-medium text-sm">{item.day}</p>
                    <p className="text-background/50 text-sm">{item.hours}</p>
                  </div>
                </div>)}
            </div>
            <div className="mt-6 p-4 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl border border-accent/20">
              <p className="text-sm text-background/80">
                <span className="text-accent font-semibold">📞 Hotline 24 Jam</span>
                <br />
                Untuk informasi & bantuan darurat
              </p>
            </div>

            {/* Track Booking Link */}
            
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-6">Hubungi Kami</h4>
            <div className="space-y-4">
              <a href="tel:+6281233330042" className="flex items-start gap-3 text-background/60 hover:text-accent transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center mt-0.5 group-hover:bg-accent/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
                </div>
                <div>
                  <p className="text-xs text-background/50">Telepon / WhatsApp</p>
                  <p className="text-background font-medium text-sm">+62 812-3333-0042</p>
                </div>
              </a>
              <a href="mailto:info@travelminibus.com" className="flex items-start gap-3 text-background/60 hover:text-accent transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center mt-0.5 group-hover:bg-accent/20 transition-colors">
                  <Mail className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
                </div>
                <div>
                  <p className="text-xs text-background/50">Email</p>
                  <p className="text-background font-medium text-sm">info@travelminibus.com</p>
                </div>
              </a>
              <div className="flex items-start gap-3 text-background/60">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center mt-0.5">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-background/50">Kantor Pusat</p>
                  <p className="text-background font-medium text-xs">
                    Jl. Letjend Sutoyo No.107, Bungur, Medaeng, Kec. Waru , Kabupaten Sidoarjo, Jawa Timur 61256 
                    <br />
                    ​
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container px-4 sm:px-6 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm flex-wrap justify-center">
            <a href="#" className="text-background/50 hover:text-accent transition-colors">
              Syarat & Ketentuan
            </a>
            <a href="#" className="text-background/50 hover:text-accent transition-colors">
              Kebijakan Privasi
            </a>
            <button onClick={scrollToTop} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-background/10 flex items-center justify-center hover:bg-primary transition-colors shrink-0" aria-label="Kembali ke atas">
              <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 -rotate-45 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </footer>;
});
Footer.displayName = "Footer";
export default Footer;