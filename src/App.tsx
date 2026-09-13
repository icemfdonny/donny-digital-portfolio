import About from "./components/About";
import Capabilities from "./components/Capabilities";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import Process from "./components/Process";
import Work from "./components/Work";

export default function App() {
  return (
    <>
      <a
        href="#home"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-orange focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-charcoal"
      >
        Skip to content
      </a>
      <Navbar />
      <main>
        <Hero />
        <Work />
        <Capabilities />
        <About />
        <Process />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
