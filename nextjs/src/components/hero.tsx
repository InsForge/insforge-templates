import Image from "next/image";

import { NextLogo } from "@/components/next-logo";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="flex gap-8 justify-center items-center">
        <a
          href="https://insforge.dev"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-3 text-stone-950"
        >
          <Image
            src="/favicon.ico"
            alt="InsForge"
            width={60}
            height={60}
            className="h-[44px] w-[44px] rounded-xl"
          />
          <span className="text-[28px] font-semibold tracking-[-0.03em]">InsForge</span>
        </a>
        <span className="h-6 rotate-45 border-l border-stone-300" />
        <a href="https://nextjs.org" target="_blank" rel="noreferrer" className="text-stone-950">
          <NextLogo />
        </a>
      </div>

      <h1 className="sr-only">InsForge and Next.js Starter Template</h1>

      <p className="max-w-2xl text-center text-3xl leading-tight text-stone-950 lg:text-4xl">
        The fastest way to build apps with{" "}
        <a href="https://insforge.dev" target="_blank" rel="noreferrer" className="font-bold hover:underline">
          InsForge
        </a>{" "}
        and{" "}
        <a href="https://nextjs.org" target="_blank" rel="noreferrer" className="font-bold hover:underline">
          Next.js
        </a>
      </p>

      <p className="max-w-xl text-center text-sm leading-7 text-stone-600">
        A simple starter with auth, protected routes, and example database reads so you can
        get from blank project to real product work without rebuilding the basics.
      </p>

      <div className="w-full bg-gradient-to-r from-transparent via-stone-900/10 to-transparent p-px" />
    </div>
  );
}
