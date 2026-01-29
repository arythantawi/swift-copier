import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import RouteCleanup from "@/components/RouteCleanup";
import LoadingScreen from "@/components/LoadingScreen";
import { SiteDataProvider } from "@/hooks/useSiteData";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/index";
import SearchResults from "./pages/search-results";
import Booking from "./pages/booking";

import Admin from "./pages/admin";
import AdminLogin from "./pages/admin-login";
import Auth from "./pages/auth";
import MyBookings from "./pages/my-bookings";
import Profile from "./pages/profile";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    // Check if this is the first visit in this session
    const hasLoaded = sessionStorage.getItem('44trans-loaded');
    if (hasLoaded) {
      setIsLoading(false);
      setShowApp(true);
    }
  }, []);

  const handleLoadingComplete = () => {
    sessionStorage.setItem('44trans-loaded', 'true');
    setIsLoading(false);
    setShowApp(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
{showApp && (
          <AuthProvider>
            <SiteDataProvider>
              <HashRouter>
                <RouteCleanup />
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/booking" element={<Booking />} />
                    
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/my-bookings" element={<MyBookings />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<Admin />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </HashRouter>
            </SiteDataProvider>
          </AuthProvider>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
