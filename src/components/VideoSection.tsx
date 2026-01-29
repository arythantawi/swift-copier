import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useVideos } from '@/hooks/useSiteData';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createSafeGsapContext } from '@/lib/gsapUtils';

gsap.registerPlugin(ScrollTrigger);

interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  is_featured: boolean;
  category: string;
}

type VideoCategory = 'semua' | 'promosi' | 'tutorial' | 'testimoni';

const categoryLabels: Record<VideoCategory, string> = {
  semua: 'Semua',
  promosi: 'Promosi',
  tutorial: 'Tutorial',
  testimoni: 'Testimoni',
};

const AUTOPLAY_INTERVAL = 5000; // 5 seconds

// Extract YouTube video ID from various URL formats
const getYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Get YouTube thumbnail URL with fallback for shorts
const getYouTubeThumbnail = (url: string, customThumbnail: string | null): string => {
  if (customThumbnail) return customThumbnail;
  
  const videoId = getYouTubeId(url);
  if (!videoId) return '/placeholder.svg';
  
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

const VideoSection = () => {
  const { videos, isLoading: loading } = useVideos();
  const [activeCategory, setActiveCategory] = useState<VideoCategory>('semua');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);
  const [autoplayProgress, setAutoplayProgress] = useState(0);
  
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const mainVideoRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const parallaxBg1Ref = useRef<HTMLDivElement>(null);
  const parallaxBg2Ref = useRef<HTMLDivElement>(null);
  const parallaxBg3Ref = useRef<HTMLDivElement>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter videos based on category
  const filteredVideos = activeCategory === 'semua' 
    ? videos 
    : videos.filter(v => v.category === activeCategory);

  // Get available categories that have videos
  const availableCategories = ['semua', ...new Set(videos.map(v => v.category))] as VideoCategory[];

  const activeVideo = filteredVideos[activeVideoIndex];

  // Handle video selection with animation
  const handleVideoSelect = useCallback((index: number, skipAnimation = false) => {
    if (index === activeVideoIndex && !skipAnimation) return;
    
    // Reset autoplay progress
    setAutoplayProgress(0);
    
    if (skipAnimation) {
      setActiveVideoIndex(index);
      setIsPlaying(false);
      return;
    }
    
    // Animate out current video
    gsap.to(mainVideoRef.current, {
      opacity: 0,
      scale: 0.98,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        setActiveVideoIndex(index);
        setIsPlaying(false);
        // Animate in new video
        gsap.fromTo(
          mainVideoRef.current,
          { opacity: 0, scale: 0.98 },
          { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
        );
      },
    });
  }, [activeVideoIndex]);

  const handleNextVideo = useCallback(() => {
    const newIndex = activeVideoIndex < filteredVideos.length - 1 ? activeVideoIndex + 1 : 0;
    handleVideoSelect(newIndex);
  }, [activeVideoIndex, filteredVideos.length, handleVideoSelect]);

  const handlePrevVideo = useCallback(() => {
    const newIndex = activeVideoIndex > 0 ? activeVideoIndex - 1 : filteredVideos.length - 1;
    handleVideoSelect(newIndex);
  }, [activeVideoIndex, filteredVideos.length, handleVideoSelect]);

  // GSAP Animations with Parallax
  useEffect(() => {
    const ctx = createSafeGsapContext(sectionRef, () => {
      // Header animation
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Main video animation
      gsap.fromTo(
        mainVideoRef.current,
        { opacity: 0, scale: 0.95, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: mainVideoRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Parallax background effects
      if (parallaxBg1Ref.current) {
        gsap.to(parallaxBg1Ref.current, {
          y: -100,
          x: 50,
          scale: 1.2,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      if (parallaxBg2Ref.current) {
        gsap.to(parallaxBg2Ref.current, {
          y: 80,
          x: -30,
          scale: 0.9,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5,
          },
        });
      }

      if (parallaxBg3Ref.current) {
        gsap.to(parallaxBg3Ref.current, {
          y: -60,
          rotate: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 2,
          },
        });
      }

      // Thumbnails stagger animation
      if (thumbnailsRef.current) {
        const thumbnails = thumbnailsRef.current.querySelectorAll('.video-thumbnail');
        gsap.fromTo(
          thumbnails,
          { opacity: 0, y: 40, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: thumbnailsRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    });

    return () => ctx?.revert();
  }, [videos]);

  // Autoplay carousel logic
  useEffect(() => {
    if (!isAutoplayEnabled || isPlaying || filteredVideos.length <= 1) {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setAutoplayProgress(0);
      return;
    }

    // Progress bar update
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / AUTOPLAY_INTERVAL) * 100, 100);
      setAutoplayProgress(progress);
    }, 50);

    // Auto advance to next video
    autoplayTimerRef.current = setTimeout(() => {
      handleNextVideo();
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [activeVideoIndex, isAutoplayEnabled, isPlaying, filteredVideos.length, handleNextVideo]);

  // Reset active video when category changes
  useEffect(() => {
    setActiveVideoIndex(0);
    setIsPlaying(false);
    setAutoplayProgress(0);
  }, [activeCategory]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // Pause autoplay when video is playing
    if (!isPlaying) {
      setIsAutoplayEnabled(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleAutoplay = () => {
    setIsAutoplayEnabled(!isAutoplayEnabled);
  };

  const openFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen?.();
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background via-secondary/20 to-background">
        <div className="container">
          <div className="flex items-center justify-center h-64">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <section 
      ref={sectionRef} 
      className="relative py-16 md:py-24 overflow-hidden"
    >
      {/* Parallax Background Elements */}
      <div className="absolute inset-0 bg-white" />
      
      {/* Floating parallax shapes */}
      <div 
        ref={parallaxBg1Ref}
        className="absolute top-20 left-[10%] w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-3xl pointer-events-none"
      />
      <div 
        ref={parallaxBg2Ref}
        className="absolute bottom-20 right-[10%] w-64 h-64 md:w-80 md:h-80 bg-gradient-to-tr from-accent/10 to-accent/5 rounded-full blur-3xl pointer-events-none"
      />
      <div 
        ref={parallaxBg3Ref}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-primary/5 rounded-full pointer-events-none"
      />
      
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--primary-rgb),0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary-rgb),0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      
      <div className="container relative px-4 sm:px-6">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full mb-4">
            <Play className="w-4 h-4 text-primary" fill="currentColor" />
            <span className="text-sm font-medium text-primary">Video Gallery</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Lihat Perjalanan
            <span className="text-primary"> Kami</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Tonton video untuk melihat pengalaman perjalanan bersama Travel Minibus
          </p>
        </div>

        {/* Category Filter */}
        {availableCategories.length > 2 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8 md:mb-12">
            {availableCategories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-5 transition-all duration-300 ${
                  activeCategory === category 
                    ? 'shadow-lg shadow-primary/25' 
                    : 'hover:bg-secondary'
                }`}
              >
                {categoryLabels[category] || category}
              </Button>
            ))}
          </div>
        )}

        {/* No videos for category */}
        {filteredVideos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">Tidak ada video untuk kategori ini</p>
          </div>
        )}

        {/* Main Video Player */}
        {activeVideo && (
          <div ref={mainVideoRef} className="mb-8">
            <div className="relative max-w-5xl mx-auto">
              {/* Video Container */}
              <div className="group/video relative rounded-2xl md:rounded-3xl overflow-hidden bg-black shadow-2xl shadow-black/20">
                {/* Autoplay Progress Bar */}
                {isAutoplayEnabled && !isPlaying && filteredVideos.length > 1 && (
                  <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-white/20">
                    <div 
                      className="h-full bg-primary transition-all duration-100 ease-linear"
                      style={{ width: `${autoplayProgress}%` }}
                    />
                  </div>
                )}

                <div className="aspect-video relative">
                  {isPlaying ? (
                    <iframe
                      ref={iframeRef}
                      src={`https://www.youtube.com/embed/${getYouTubeId(activeVideo.youtube_url)}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1`}
                      title={activeVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  ) : (
                    <>
                      <img
                        src={getYouTubeThumbnail(activeVideo.youtube_url, activeVideo.thumbnail_url)}
                        alt={activeVideo.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const videoId = getYouTubeId(activeVideo.youtube_url);
                          if (videoId && !target.src.includes('hqdefault')) {
                            target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                          }
                        }}
                      />
                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      
                      {/* Animated Play Button */}
                      <div 
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                      >
                        <div className="play-container w-24 h-24 md:w-32 md:h-32 relative rounded-full">
                          {/* Conic gradient border */}
                          <div className="absolute inset-0 rounded-full bg-[conic-gradient(hsl(var(--primary)),hsl(var(--primary)))] animate-[borderSpin_2s_linear_infinite]" />
                          {/* Inner black circle */}
                          <div className="absolute w-[93%] h-[93%] bg-black rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                          {/* Play triangle icon */}
                          <div className="absolute w-10 h-10 md:w-12 md:h-12 left-[55%] top-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary rotate-90 transition-all duration-300 group-hover:scale-110" style={{ clipPath: 'polygon(50% 15%, 0% 100%, 100% 100%)' }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Video Controls Bar - Hidden when playing, shown on hover/touch */}
                <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-all duration-300 ${
                  isPlaying 
                    ? 'opacity-0 translate-y-4 group-hover/video:opacity-100 group-hover/video:translate-y-0' 
                    : 'opacity-100 translate-y-0'
                }`}>
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full capitalize">
                          {activeVideo.category}
                        </span>
                        {filteredVideos.length > 1 && (
                          <span className="px-2.5 py-1 bg-white/10 text-white text-xs font-medium rounded-full">
                            {activeVideoIndex + 1} / {filteredVideos.length}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white text-lg md:text-2xl font-bold truncate">
                        {activeVideo.title}
                      </h3>
                      {activeVideo.description && (
                        <p className="text-white/70 text-sm md:text-base line-clamp-1 mt-1">
                          {activeVideo.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Control Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Autoplay Toggle */}
                      {filteredVideos.length > 1 && !isPlaying && (
                        <button
                          onClick={toggleAutoplay}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isAutoplayEnabled 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                          title={isAutoplayEnabled ? 'Autoplay On' : 'Autoplay Off'}
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.5 12a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z" />
                            <path d="M12 2v2" />
                            <path d="M12 20v2" />
                            <path d="m4.93 4.93 1.41 1.41" />
                            <path d="m17.66 17.66 1.41 1.41" />
                            <path d="M2 12h2" />
                            <path d="M20 12h2" />
                            <path d="m6.34 17.66-1.41 1.41" />
                            <path d="m19.07 4.93-1.41 1.41" />
                          </svg>
                        </button>
                      )}
                      {isPlaying && (
                        <>
                          <button
                            onClick={toggleMute}
                            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                          >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={openFullscreen}
                            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                          >
                            <Maximize2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <div 
                        onClick={togglePlay}
                        className="play-container-sm w-12 h-12 relative rounded-full cursor-pointer group"
                      >
                        {/* Conic gradient border */}
                        <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
                          isPlaying 
                            ? 'bg-[conic-gradient(hsl(var(--primary)),hsl(var(--primary)))]' 
                            : 'bg-[conic-gradient(hsl(var(--primary)),transparent_20%)]'
                        } ${isPlaying ? 'animate-[borderSpin_700ms_ease-in-out]' : ''}`} />
                        {/* Inner circle */}
                        <div className="absolute w-[85%] h-[85%] bg-primary rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors" />
                        {/* Play/Pause icons */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {isPlaying ? (
                            <div className="flex gap-1">
                              <div className="w-1 h-4 bg-primary-foreground rounded-sm animate-[reveal_300ms_ease-in-out_forwards]" />
                              <div className="w-1 h-4 bg-primary-foreground rounded-sm animate-[reveal_300ms_ease-in-out_150ms_forwards]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 bg-primary-foreground rotate-90 ml-0.5 transition-all duration-300 group-hover:scale-110" style={{ clipPath: 'polygon(50% 15%, 0% 100%, 100% 100%)' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Arrows - Hidden when playing, shown on hover/touch */}
                {filteredVideos.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevVideo}
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-all hover:scale-110 ${
                        isPlaying 
                          ? 'opacity-0 -translate-x-4 group-hover/video:opacity-100 group-hover/video:translate-x-0' 
                          : 'opacity-100 translate-x-0'
                      }`}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleNextVideo}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-all hover:scale-110 ${
                        isPlaying 
                          ? 'opacity-0 translate-x-4 group-hover/video:opacity-100 group-hover/video:translate-x-0' 
                          : 'opacity-100 translate-x-0'
                      }`}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Video Counter Dots */}
              {filteredVideos.length > 1 && (
                <div className="flex justify-center mt-4 gap-1.5">
                  {filteredVideos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleVideoSelect(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === activeVideoIndex 
                          ? 'w-8 bg-primary' 
                          : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Thumbnails Grid */}
        {filteredVideos.length > 1 && (
          <div ref={thumbnailsRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredVideos.map((video, index) => (
              <div
                key={video.id}
                className={`video-thumbnail group cursor-pointer transition-all duration-300 ${
                  index === activeVideoIndex ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl' : ''
                }`}
                onClick={() => handleVideoSelect(index)}
              >
                <div className="relative rounded-xl overflow-hidden bg-muted">
                  <div className="aspect-video">
                    <img
                      src={getYouTubeThumbnail(video.youtube_url, video.thumbnail_url)}
                      alt={video.title}
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        index === activeVideoIndex 
                          ? 'scale-105' 
                          : 'group-hover:scale-105 group-hover:brightness-110'
                      }`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const videoId = getYouTubeId(video.youtube_url);
                        if (videoId && !target.src.includes('hqdefault')) {
                          target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        }
                      }}
                    />
                  </div>
                  
                  {/* Overlay */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                    index === activeVideoIndex 
                      ? 'bg-primary/20' 
                      : 'bg-black/30 opacity-0 group-hover:opacity-100'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${
                      index === activeVideoIndex 
                        ? 'bg-primary scale-100' 
                        : 'bg-white/90 scale-90 group-hover:scale-100'
                    }`}>
                      <Play 
                        className={`w-4 h-4 ml-0.5 ${index === activeVideoIndex ? 'text-primary-foreground' : 'text-primary'}`} 
                        fill="currentColor" 
                      />
                    </div>
                  </div>

                  {/* Active indicator */}
                  {index === activeVideoIndex && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-pulse" />
                        Now
                      </span>
                    </div>
                  )}
                </div>
                
                <h4 className={`mt-2 text-sm font-medium line-clamp-2 transition-colors duration-300 ${
                  index === activeVideoIndex 
                    ? 'text-primary' 
                    : 'text-foreground group-hover:text-primary'
                }`}>
                  {video.title}
                </h4>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoSection;
