import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Copy, CheckCircle, Building2, User, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
gsap.registerPlugin(ScrollTrigger);
const PaymentInfo = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const bankDetails = {
    bank: 'BCA',
    accountNumber: '0613002917',
    accountName: 'Muhammad Nur Huda'
  };
  const copyToClipboard = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
    setCopied(true);
    toast.success('Nomor rekening berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.payment-content', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%'
        },
        x: -50,
        opacity: 0,
        duration: 0.8
      });
      gsap.from('.payment-card', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%'
        },
        x: 50,
        opacity: 0,
        duration: 0.8,
        delay: 0.2
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);
  const steps = ['Lakukan pemesanan melalui form booking', 'Sistem akan menghasilkan Order ID & total pembayaran', 'Transfer ke rekening yang tertera', 'Upload bukti transfer melalui sistem', 'Admin memverifikasi pembayaran Anda', 'Status berubah menjadi LUNAS ✓'];
  
  return (
    <section ref={sectionRef} className="py-12 md:py-20 bg-background">
      <div className="container px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Content */}
          <div className="payment-content space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Pembayaran</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                Cara Pembayaran
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-lg">
                Ikuti langkah mudah berikut untuk menyelesaikan pembayaran Anda
              </p>
            </div>
            
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <span className="text-sm text-foreground/80">{step}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right - Bank Card */}
          <div className="payment-card">
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 md:p-8 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Bank Transfer</p>
                  <p className="font-bold text-xl">{bankDetails.bank}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/70 text-xs mb-1 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    Nomor Rekening
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xl md:text-2xl font-bold tracking-wider">
                      {bankDetails.accountNumber}
                    </span>
                    <button 
                      onClick={copyToClipboard}
                      className="flex-shrink-0 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/70 text-xs mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Atas Nama
                  </p>
                  <p className="font-semibold text-lg">{bankDetails.accountName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default PaymentInfo;