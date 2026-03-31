import Link from "next/link";
import Image from "next/image";

import { NextLogo } from "../components/next-logo";
import { signOut } from "@/lib/auth-actions";
import { getCurrentViewer } from "@/lib/auth-state";

const isVercelDeployment =
  process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production";

export default async function Home() {
  const viewer = await getCurrentViewer();

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-stone-900/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center px-5 text-sm">
            <div className="flex gap-3 items-center font-semibold text-stone-950">
              <span>Next.js InsForge Starter</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates%2Ftree%2Fmain&root-directory=nextjs&project-name=insforge-nextjs-starter&repository-name=insforge-nextjs-starter&env=NEXT_PUBLIC_INSFORGE_URL,NEXT_PUBLIC_INSFORGE_ANON_KEY,NEXT_PUBLIC_APP_URL&envDescription=Connect%20your%20InsForge%20project%20URL%2C%20anon%20key%2C%20and%20app%20URL.&external-id=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates%2Ftree%2Fmain%2Fnextjs&demo-title=Next.js%20InsForge%20Starter&demo-description=A%20clean%20Next.js%20starter%20with%20InsForge%20auth%20and%20Tailwind%20CSS.&demo-image=https%3A%2F%2Fraw.githubusercontent.com%2FInsForge%2Finsforge-templates%2Fmain%2Fnextjs%2Fassets%2Fnextjs-starter.png"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-3 py-2 text-xs font-medium text-white hover:bg-stone-800"
              >
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 76 65"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
                <span>Deploy to Vercel</span>
              </a>
              {viewer.isAuthenticated ? (
                <>
                  <div className="text-xs font-medium text-stone-700">
                    {viewer.name || viewer.email || "Signed in"}
                  </div>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 hover:bg-stone-50"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/sign-in"
                    className="inline-flex items-center rounded-md border border-stone-950 bg-stone-950 px-3 py-2 text-xs font-medium text-white hover:bg-stone-800"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className="inline-flex items-center rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 hover:bg-stone-50"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col gap-16 max-w-5xl p-5 w-full">
          <section className="flex flex-col gap-10 items-center pt-8">
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
              <span className="border-l rotate-45 h-6 border-stone-300" />
              <a
                href="https://nextjs.org"
                target="_blank"
                rel="noreferrer"
                className="text-stone-950"
              >
                <NextLogo />
              </a>
            </div>

            <h1 className="sr-only">InsForge and Next.js Starter Template</h1>

            <p className="text-3xl lg:text-4xl leading-tight mx-auto max-w-2xl text-center text-stone-950">
              <span className="block">The fastest way to build apps with</span>
              <span className="block">
                <a
                  href="https://insforge.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold hover:underline"
                >
                  InsForge
                </a>{" "}
                and{" "}
                <a
                  href="https://nextjs.org"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold hover:underline"
                >
                  Next.js
                </a>
              </span>
            </p>

            <p className="max-w-xl text-center text-sm leading-7 text-stone-600">
              A clean starter with App Router, TypeScript, and Tailwind CSS so you can begin
              with a simple foundation and layer in auth, data, and product-specific flows
              when you&apos;re ready.
            </p>

            <div className="w-full p-px bg-gradient-to-r from-transparent via-stone-900/10 to-transparent" />
          </section>

          <section className="flex-1 flex flex-col gap-6 px-4">
            <h2 className="font-medium text-xl mb-2 text-stone-950">Next steps</h2>
            <ol className="flex flex-col gap-6">
              {isVercelDeployment ? (
                <li className="relative">
                  <input type="checkbox" className="absolute top-[3px] h-4 w-4 cursor-pointer rounded-sm border border-stone-300 accent-stone-900" />
                  <div className="ml-8">
                    <h3 className="text-base font-medium text-stone-950">Set up redirect urls</h3>
                    <div className="mt-1 text-sm font-normal text-stone-600 space-y-4">
                      <p>It looks like this app is hosted on Vercel.</p>
                      <p>
                        This particular deployment is{" "}
                        <span className="relative rounded bg-stone-100 px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-stone-700 border border-stone-200">
                          &quot;{process.env.VERCEL_ENV}&quot;
                        </span>{" "}
                        on{" "}
                        <span className="relative rounded bg-stone-100 px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-stone-700 border border-stone-200 break-all">
                          https://{process.env.VERCEL_URL}
                        </span>
                        .
                      </p>
                      <p>
                        If you add auth later, update your provider settings with redirect URLs
                        based on your Vercel deployment URLs.
                      </p>
                      <ul className="space-y-2">
                        <li>
                          -{" "}
                          <span className="relative rounded bg-stone-100 px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-stone-700 border border-stone-200">
                            http://localhost:3000/**
                          </span>
                        </li>
                        <li>
                          -{" "}
                          <span className="relative rounded bg-stone-100 px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-stone-700 border border-stone-200">
                            {`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}/**`}
                          </span>
                        </li>
                        <li>
                          -{" "}
                          <span className="relative rounded bg-stone-100 px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-stone-700 border border-stone-200">
                            {`https://${(
                              process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "your-app.vercel.app"
                            ).replace(".vercel.app", "")}-*-[vercel-team-url].vercel.app/**`}
                          </span>
                        </li>
                      </ul>
                      <a
                        href="https://vercel.com/docs/deployments/generated-urls"
                        target="_blank"
                        rel="noreferrer"
                        className="text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
                      >
                        Vercel deployment URL docs <span>↗</span>
                      </a>
                    </div>
                  </div>
                </li>
              ) : null}

              <li className="relative">
                <input type="checkbox" className="absolute top-[3px] h-4 w-4 cursor-pointer rounded-sm border border-stone-300 accent-stone-900" />
                <div className="ml-8">
                  <h3 className="text-base font-medium text-stone-950">Sign up your first user</h3>
                  <div className="mt-1 text-sm font-normal text-stone-600 space-y-3">
                    <p>
                      Open the Sign up page and create the first account for this project so
                      you can validate the auth flow end to end before building out the rest
                      of the app.
                    </p>
                  </div>
                </div>
              </li>
            </ol>
          </section>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://insforge.dev"
              target="_blank"
              rel="noreferrer"
              className="font-bold hover:underline"
            >
              InsForge
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
