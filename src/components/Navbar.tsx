import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Search, User, LogOut, ClipboardList, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import logo44Trans from '@/assets/logo-44trans.png';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [{
    href: '#rute',
    label: 'Rute'
  }, {
    href: '#pembayaran',
    label: 'Pembayaran'
  }, {
    href: '#kontak',
    label: 'Kontak'
  }];

  const trackLink = {
    to: '/track',
    label: 'Cek Pesanan'
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || '';
    if (name.includes('@')) {
      return name.charAt(0).toUpperCase();
    }
    return name
      .split(' ')
      .map((n: string) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  return <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-card/95 backdrop-blur-lg shadow-lg border-b border-border/50' : 'bg-transparent'}`}>
      <div className="container px-4 sm:px-6">
        <nav className="flex items-center justify-between h-14 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-9 h-9 sm:w-10 md:w-12 sm:h-10 md:h-12 rounded-full border-2 border-primary/50 bg-white/90 p-0.5 shadow-sm flex-shrink-0">
              <img src={logo44Trans} alt="44 Trans Jawa Bali" className="w-full h-full object-contain rounded-full" />
            </div>
            <span className={`font-display font-bold text-sm sm:text-base md:text-lg ${isScrolled ? 'text-foreground' : 'text-white'} hidden xs:inline sm:inline`}>44 TRANS JAWA BALI</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => <a key={link.href} href={link.href} className={`font-medium transition-colors hover:text-accent ${isScrolled ? 'text-foreground' : 'text-white/90'}`}>
                {link.label}
              </a>)}
            <Link to={trackLink.to} className={`font-medium transition-colors hover:text-accent flex items-center gap-1.5 ${isScrolled ? 'text-foreground' : 'text-white/90'}`}>
              <Search className="w-4 h-4" />
              {trackLink.label}
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {!isLoading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                      {getUserName()}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium">{getUserName()}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/my-bookings" className="flex items-center gap-2 cursor-pointer">
                      <ClipboardList className="w-4 h-4" />
                      Pesanan Saya
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="cta-btn relative flex justify-center items-center rounded-md bg-[#183153] shadow-[0px_6px_24px_0px_rgba(0,0,0,0.2)] overflow-hidden cursor-pointer border-none group">
                <span className="absolute inset-0 w-0 bg-accent transition-all duration-400 ease-in-out right-0 group-hover:w-full group-hover:left-0" />
                <span className="relative text-center w-full px-5 py-3 text-white text-sm font-bold tracking-[0.2em] z-20 transition-all duration-300 ease-in-out group-hover:text-[#183153] group-hover:animate-[scaleUp_0.3s_ease-in-out]">
                  LOGIN
                </span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2" aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'} aria-expanded={isMobileMenuOpen}>
            {isMobileMenuOpen ? <X className={`w-6 h-6 ${isScrolled ? 'text-foreground' : 'text-white'}`} /> : <Menu className={`w-6 h-6 ${isScrolled ? 'text-foreground' : 'text-white'}`} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && <div className="md:hidden bg-card border-t border-border py-4 px-2 animate-fade-up">
            <div className="flex flex-col gap-2">
              {/* User Profile Section for Mobile */}
              {!isLoading && user && (
                <div className="flex items-center gap-3 px-4 py-3 bg-secondary/50 rounded-lg mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{getUserName()}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              )}

              {navLinks.map(link => <a key={link.href} href={link.href} className="px-4 py-3 rounded-lg text-foreground font-medium hover:bg-secondary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  {link.label}
                </a>)}
              <Link to={user ? "/my-bookings" : "/track"} className="flex items-center gap-2 px-4 py-3 rounded-lg text-foreground font-medium hover:bg-secondary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <ClipboardList className="w-4 h-4" />
                {user ? 'Pesanan Saya' : 'Cek Pesanan'}
              </Link>
              <a href="tel:+6281234567890" className="flex items-center gap-2 px-4 py-3 rounded-lg text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>0812-3456-7890</span>
              </a>
              
              {!isLoading && user ? (
                <button 
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }} 
                  className="flex items-center justify-center gap-2 mx-4 mt-2 px-5 py-3 rounded-md bg-destructive text-destructive-foreground font-bold text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  KELUAR
                </button>
              ) : (
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="cta-btn relative flex justify-center items-center rounded-md bg-[#183153] shadow-[0px_6px_24px_0px_rgba(0,0,0,0.2)] overflow-hidden cursor-pointer border-none group mx-4 mt-2 w-[calc(100%-2rem)]">
                  <span className="absolute inset-0 w-0 bg-accent transition-all duration-400 ease-in-out right-0 group-hover:w-full group-hover:left-0" />
                  <span className="relative text-center w-full px-5 py-3 text-white text-sm font-bold tracking-[0.2em] z-20 transition-all duration-300 ease-in-out group-hover:text-[#183153] group-hover:animate-[scaleUp_0.3s_ease-in-out]">
                    LOGIN / DAFTAR
                  </span>
                </Link>
              )}
            </div>
          </div>}
      </div>
    </header>;
};
export default Navbar;