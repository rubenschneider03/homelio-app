import Navbar         from "@/components/landing/Navbar";
import HeadphoneScroll from "@/components/HeadphoneScroll";
import InvisibleMarket from "@/components/landing/InvisibleMarket";
import FinalCTA        from "@/components/landing/FinalCTA";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeadphoneScroll />
      <InvisibleMarket />
      <FinalCTA />
    </>
  );
}
