import Navbar                   from "@/components/landing/Navbar";
import VideoScrollytellingClean from "@/components/VideoScrollytellingClean";
import InvisibleMarket          from "@/components/landing/InvisibleMarket";
import FinalCTA                 from "@/components/landing/FinalCTA";

export default function Home() {
  return (
    <>
      <Navbar />
      <VideoScrollytellingClean />
      <InvisibleMarket />
      <FinalCTA />
    </>
  );
}
