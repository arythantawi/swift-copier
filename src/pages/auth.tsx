import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Loader2 } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
import logo44Trans from '@/assets/logo-44trans.png';
const Auth = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword
      });
      if (error) throw error;
      toast({
        title: "Berhasil masuk!",
        description: "Selamat datang kembali"
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Gagal masuk",
        description: error.message || "Email atau password salah",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            full_name: signUpName
          },
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      toast({
        title: "Pendaftaran berhasil!",
        description: "Silakan cek email Anda untuk verifikasi"
      });
      setIsRightPanelActive(false);
    } catch (error: any) {
      toast({
        title: "Gagal mendaftar",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleAuth = async () => {
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Gagal login dengan Google",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary flex justify-center items-center flex-col font-sans py-8 px-4">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-primary/50 bg-white p-1 shadow-lg">
          <img src={logo44Trans} alt="44 Trans" className="w-full h-full object-contain rounded-full" />
        </div>
        <span className="font-display font-bold text-xl text-foreground">44 TRANS JAWA BALI</span>
      </div>

      {/* Container */}
      <div className={`bg-card rounded-xl shadow-2xl relative overflow-hidden w-full max-w-[768px] min-h-[480px] transition-all duration-600 ${isRightPanelActive ? 'right-panel-active' : ''}`} style={{
      boxShadow: '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.12)'
    }}>
        {/* Sign Up Form */}
        <div className={`absolute top-0 h-full transition-all duration-600 ease-in-out left-0 w-1/2 ${isRightPanelActive ? 'translate-x-full opacity-100 z-[5] animate-show' : 'opacity-0 z-[1]'}`}>
          <form onSubmit={handleSignUp} className="bg-card flex items-center justify-center flex-col px-8 md:px-12 h-full text-center">
            <h1 className="font-bold text-2xl text-foreground mb-2">Buat Akun</h1>
            
            <div className="flex gap-3 my-4">
              <button type="button" onClick={handleGoogleAuth} className="border border-border rounded-full w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors">
                <GoogleIcon />
              </button>
              
            </div>
            
            <span className="text-xs text-muted-foreground">atau gunakan email untuk pendaftaran</span>
            
            <div className="relative w-full mt-4">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Nama Lengkap" value={signUpName} onChange={e => setSignUpName(e.target.value)} className="bg-secondary border-none rounded-md px-10 py-3 my-2 w-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            
            <div className="relative w-full">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" placeholder="Email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} className="bg-secondary border-none rounded-md px-10 py-3 my-2 w-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            
            <div className="relative w-full">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" placeholder="Password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} className="bg-secondary border-none rounded-md px-10 py-3 my-2 w-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" required minLength={6} />
            </div>
            
            <button type="submit" disabled={isLoading} className="rounded-full border border-primary bg-primary text-primary-foreground text-xs font-bold py-3 px-11 uppercase tracking-wider mt-4 transition-transform active:scale-95 hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Daftar
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className={`absolute top-0 h-full transition-all duration-600 ease-in-out left-0 w-1/2 z-[2] ${isRightPanelActive ? 'translate-x-full' : ''}`}>
          <form onSubmit={handleSignIn} className="bg-card flex items-center justify-center flex-col px-8 md:px-12 h-full text-center">
            <h1 className="font-bold text-2xl text-foreground mb-2">Masuk</h1>
            
            <div className="flex gap-3 my-4">
              <button type="button" onClick={handleGoogleAuth} className="border border-border rounded-full w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors">
                <GoogleIcon />
              </button>
              
            </div>
            
            <span className="text-xs text-muted-foreground">atau gunakan akun Anda</span>
            
            <div className="relative w-full mt-4">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="email" placeholder="Email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} className="bg-secondary border-none rounded-md px-10 py-3 my-2 w-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            
            <div className="relative w-full">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" placeholder="Password" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} className="bg-secondary border-none rounded-md px-10 py-3 my-2 w-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            
            <a href="#" className="text-sm text-muted-foreground hover:text-primary mt-2">Lupa password?</a>
            
            <button type="submit" disabled={isLoading} className="rounded-full border border-primary bg-primary text-primary-foreground text-xs font-bold py-3 px-11 uppercase tracking-wider mt-4 transition-transform active:scale-95 hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Masuk
            </button>
          </form>
        </div>

        {/* Overlay Container */}
        <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-600 ease-in-out z-[100] ${isRightPanelActive ? '-translate-x-full' : ''}`}>
          <div className={`bg-gradient-to-r from-primary to-accent text-primary-foreground relative -left-full h-full w-[200%] transition-transform duration-600 ease-in-out ${isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'}`}>
            {/* Left Panel */}
            <div className={`absolute flex items-center justify-center flex-col px-8 text-center top-0 h-full w-1/2 transition-transform duration-600 ease-in-out ${isRightPanelActive ? 'translate-x-0' : '-translate-x-[20%]'}`}>
              <h1 className="font-bold text-2xl mb-4">Selamat Datang!</h1>
              <p className="text-sm leading-5 tracking-wide mb-6 opacity-90">
                Untuk tetap terhubung dengan kami, silakan masuk dengan akun Anda
              </p>
              <button type="button" onClick={() => setIsRightPanelActive(false)} className="rounded-full bg-transparent border border-white text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-all hover:bg-white/10 active:scale-95">
                Masuk
              </button>
            </div>

            {/* Right Panel */}
            <div className={`absolute flex items-center justify-center flex-col px-8 text-center top-0 h-full w-1/2 right-0 transition-transform duration-600 ease-in-out ${isRightPanelActive ? 'translate-x-[20%]' : 'translate-x-0'}`}>
              <h1 className="font-bold text-2xl mb-4 text-center">Hallo sahabat trans </h1>
              <p className="text-sm leading-5 tracking-wide mb-6 opacity-90">
                Masukkan data Anda dan mulai perjalanan bersama kami
              </p>
              <button type="button" onClick={() => setIsRightPanelActive(true)} className="rounded-full bg-transparent border border-white text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-all hover:bg-white/10 active:scale-95">
                Daftar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Home */}
      <button onClick={() => navigate('/')} className="mt-6 text-muted-foreground hover:text-primary text-sm transition-colors">
        ← Kembali ke Beranda
      </button>

      <style>{`
        @keyframes show {
          0%, 49.99% {
            opacity: 0;
            z-index: 1;
          }
          50%, 100% {
            opacity: 1;
            z-index: 5;
          }
        }
        .animate-show {
          animation: show 0.6s;
        }
      `}</style>
    </div>;
};
export default Auth;