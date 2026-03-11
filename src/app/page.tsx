import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Gallery } from "@/components/landing/gallery";
import { Features } from "@/components/landing/features";
import { Workflow } from "@/components/landing/workflow";
import { Testimonials } from "@/components/landing/testimonials";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <Hero />
        <Gallery />
        <Features />
        <Workflow />
        <Testimonials />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
