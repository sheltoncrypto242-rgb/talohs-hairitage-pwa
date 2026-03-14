import heroBg from "@/assets/hero-bg.jpg";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="Healthy hair" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 to-foreground/30" />
      </div>
      <div className="relative container mx-auto px-4 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-lg"
        >
          <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
            Premium Hair Care, Delivered to You
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/80 font-body">
            Locally crafted solutions for stronger, healthier hair. Free delivery across Nassau.
          </p>
          <a
            href="#products"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Shop Now
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
