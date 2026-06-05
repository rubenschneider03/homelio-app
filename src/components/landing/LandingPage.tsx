"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Navbar         from "./Navbar";
import HeroSection    from "./HeroSection";
import CinematicStory from "./CinematicStory";
import InvisibleMarket from "./InvisibleMarket";
import ForSeekers     from "./ForSeekers";
import ForManagers    from "./ForManagers";
import AIMatching     from "./AIMatching";
import FinalCTA       from "./FinalCTA";

// LoadingScreen runs GSAP — skip SSR entirely
const LoadingScreen = dynamic(() => import("./LoadingScreen"), { ssr: false });

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      {/* Loading overlay — unmounts when GSAP fade-out finishes */}
      {!isLoaded && (
        <LoadingScreen onComplete={() => setIsLoaded(true)} />
      )}

      {/* Main content — mounts fresh after loading, fades in via CSS */}
      {isLoaded && (
        <div style={{ animation: "contentReveal 0.55s ease forwards" }}>
          <Navbar />
          <main>
            <HeroSection />
            <CinematicStory />
            <InvisibleMarket />
            <ForSeekers />
            <ForManagers />
            <AIMatching />
            <FinalCTA />
          </main>
        </div>
      )}
    </>
  );
}
