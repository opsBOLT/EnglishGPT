import { motion } from "framer-motion";
import { BorderTrail } from "@/components/ui/border-trail";
import { AnimatedShinyButton } from "@/components/ui/animated-shiny-button";
import { AnimatedShinyHero } from "@/components/ui/animated-shiny-hero";
import { Navbar1 } from "@/components/ui/navbar-1";

const Landing = () => {
  return (
    <div className="min-h-screen bg-white outline-none border-none">
      <div className="min-h-screen w-full relative outline-none border-none">
        <Navbar1 />

        <div
          className="absolute inset-0 z-0"
          style={{
            background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #7c3aed 100%)",
          }}
        />

        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e2e8f0 1px, transparent 1px),
              linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: "20px 30px",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 top-[70vh] flex justify-center z-30">
          <AnimatedShinyHero className="pointer-events-auto shadow-[0_16px_48px_rgba(170,128,243,0.35)] text-sm sm:text-base">
            The best learning decision you'll ever make
          </AnimatedShinyHero>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center overflow-hidden min-h-screen">
          <div className="relative flex w-full scale-y-125 items-center justify-center isolate z-0 -translate-y-[30%]">
            <motion.div
              initial={{ opacity: 0.5, width: "15rem" }}
              whileInView={{ opacity: 1, width: "30rem" }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              style={{
                backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
              }}
              className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-purple-300 via-transparent to-transparent [--conic-position:from_70deg_at_center_top]"
            />
            <motion.div
              initial={{ opacity: 0.5, width: "15rem" }}
              whileInView={{ opacity: 1, width: "30rem" }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              style={{
                backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
              }}
              className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-purple-300 [--conic-position:from_290deg_at_center_top]"
            />
            <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-purple-300 opacity-40 blur-3xl"></div>
            <motion.div
              initial={{ width: "8rem" }}
              whileInView={{ width: "16rem" }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-purple-300 blur-2xl"
            ></motion.div>
            <motion.div
              initial={{ width: "15rem" }}
              whileInView={{ width: "30rem" }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-purple-300"
            ></motion.div>
          </div>

          <div className="relative z-50 flex -translate-y-32 flex-col items-center px-5 space-y-5">
            <AnimatedShinyButton
              url="/signup"
              className="shadow-[0_12px_36px_rgba(170,128,243,0.35)] -translate-y-[20%]"
            >
              Get Started
            </AnimatedShinyButton>
            <motion.h1
              initial={{ opacity: 0.5, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              className="mt-8 py-4 text-center text-4xl font-medium tracking-tight text-black md:text-7xl -translate-y-[10%]"
            >
              Never worry about IGCSE English again
            </motion.h1>
          </div>
        </div>

        {/* Demo Section with Border Trail */}
        <div className="relative z-20 w-full max-w-6xl mx-auto px-8 py-12 -mt-[40vh] md:-mt-[32vh] lg:-mt-[28vh]">
          <div className="relative w-full h-[730px] bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-300/60">
            <BorderTrail
              className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-500"
              size={120}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            {/* User dashboard demo populated with screenshot */}
            <img
              src="/images/dashboard-demo.png"
              alt="User dashboard preview"
              className="relative z-10 h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
