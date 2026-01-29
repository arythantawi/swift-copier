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
  return <section ref={sectionRef} className="py-20 bg-white">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="payment-content">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Pembayaran Mudah
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Cara Pembayaran
            </h2>
            <p className="text-muted-foreground mb-8">
              Proses pembayaran yang simpel dan aman melalui transfer bank. 
              Konfirmasi cepat dalam hitungan menit setelah bukti transfer diterima.
            </p>

            <div className="space-y-4">
              {steps.map((step, index) => <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-foreground pt-1">{step}</p>
                </div>)}
            </div>
          </div>

          <div className="payment-card">
            
          </div>
        </div>
      </div>
    </section>;
};
export default PaymentInfo;