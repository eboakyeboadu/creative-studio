"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useAnimation, useInView } from "motion/react";
import { ChevronRight } from "lucide-react";
import Marquee from "react-fast-marquee";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ShineBorder, Timeline } from "@/components/ui/shine-border";

const tiles = [
  {
    icon: (
      <img
        src={"https://picsum.photos/seed/port1/350/350"}
        alt={""}
        className="h-[120px] w-[200px] rounded-sm md:h-full md:w-full md:rounded-sm object-cover"
        referrerPolicy="no-referrer"
      />
    ),
    bg: <div className=""></div>,
  },
  {
    icon: (
      <img
        src={"https://picsum.photos/seed/port2/350/350"}
        alt={""}
        className="h-[120px] w-[200px] rounded-sm md:h-full md:w-full md:rounded-sm object-cover"
        referrerPolicy="no-referrer"
      />
    ),
    bg: <div className=""></div>,
  },
  {
    icon: (
      <img
        src={"https://picsum.photos/seed/port3/350/350"}
        alt={""}
        className="h-[120px] w-[200px] rounded-sm md:h-full md:w-full md:rounded-sm object-cover"
        referrerPolicy="no-referrer"
      />
    ),
    bg: <div className=""></div>,
  },
  {
    icon: (
      <img
        src={"https://picsum.photos/seed/port4/350/350"}
        alt={""}
        className="h-[120px] w-[200px] rounded-sm md:h-full md:w-full md:rounded-sm object-cover"
        referrerPolicy="no-referrer"
      />
    ),
    bg: <div className=""></div>,
  },
  {
    icon: (
      <img
        src={"https://picsum.photos/seed/port5/350/350"}
        alt={""}
        className="h-[120px] w-[200px] rounded-sm md:h-full md:w-full md:rounded-sm object-cover"
        referrerPolicy="no-referrer"
      />
    ),
    bg: <div className=""></div>,
  },
  {
    icon: (
      <img
        src={"https://picsum.photos/seed/port6/350/350"}
        alt={""}
        className="h-[120px] w-[200px] rounded-sm md:h-full md:w-full md:rounded-sm object-cover"
        referrerPolicy="no-referrer"
      />
    ),
    bg: <div className=""></div>,
  },
];

const shuffleArray = (array: any[]) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

const PortfolioCard = (card: { icon: React.ReactNode; bg: React.ReactNode }) => {
  const id = useId();
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        transition: { delay: Math.random() * 2, ease: "easeOut", duration: 1 },
      });
    }
  }, [controls, inView]);

  return (
    <motion.div
      key={id}
      ref={ref}
      initial={{ opacity: 0 }}
      animate={controls}
      className={cn(
        "relative h-full w-full cursor-pointer rounded-md border object-cover p-1 md:rounded-2xl md:p-2 bg-card"
      )}
    >
      {card.icon}
    </motion.div>
  );
};

export function CTASection({ setActiveView }: { setActiveView: (view: any) => void }) {
  const [randomTiles1, setRandomTiles1] = useState<typeof tiles>([]);

  useEffect(() => {
    setRandomTiles1(shuffleArray([...tiles]));
  }, []);

  return (
    <section id="cta" className="relative p-6 pt-24 overflow-hidden">
      <ShineBorder
        borderRadius={32}
        borderWidth={3}
        className="border bg-white/5 shadow-2xl backdrop-blur-md dark:bg-black/5"
        color={["#FF007F", "#39FF14", "#00FFFF"]}
      >
        <div className="flex flex-col items-center w-full">
          <h2 className="my-8 text-2xl md:text-4xl font-black tracking-tighter uppercase italic">How it Works?</h2>
          
          <div className="grid p-4 md:p-10 gap-12 lg:grid-cols-2 items-center w-full">
            <div className="order-2 lg:order-1">
               <Timeline />
            </div>
            
            <div className="relative gap-3 flex h-full min-h-[300px] w-full flex-col items-center justify-center overflow-hidden order-1 lg:order-2">
              <Marquee
                direction="right"
                className="[--duration:40s]"
              >
                <div className="gap-4 flex py-2 px-2">
                  {randomTiles1.map((tile, idx) => (
                    <div key={idx} className="w-[150px] md:w-[250px]">
                      <PortfolioCard {...tile} />
                    </div>
                  ))}
                </div>
              </Marquee>
              <Marquee className="[--duration:40s]">
                <div className="gap-4 flex py-2 px-2">
                  {randomTiles1.map((tile, idx) => (
                    <div key={idx} className="w-[150px] md:w-[250px]">
                      <PortfolioCard {...tile} />
                    </div>
                  ))}
                </div>
              </Marquee>
            </div>
          </div>

          <div className="z-10 mt-12 flex flex-col items-center text-center max-w-2xl px-4 pb-12">
            <h1 className="text-2xl font-black md:text-5xl tracking-tighter uppercase">
              Design anything you need
            </h1>
            <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">
              Join the elite marketing teams using Creative Studio's AI-native ecosystem. 
              No credit card required to start your transformation.
            </p>
            <div className="mt-8 grid gap-4 md:flex">
              <Button
                size="lg"
                className="rounded-full px-8 h-14 font-black uppercase tracking-widest shadow-xl group border-2 border-primary"
                onClick={() => setActiveView('ai-studio')}
              >
                Get Started
                <ChevronRight className="ml-2 size-5 transition-all duration-300 ease-out group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-14 font-black uppercase tracking-widest shadow-lg group"
                onClick={() => window.open('#', '_self')}
              >
                Book a call
                <ChevronRight className="ml-2 size-5 transition-all duration-300 ease-out group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/5 blur-[120px] opacity-20" />
      </ShineBorder>
    </section>
  );
}

