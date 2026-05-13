import type { ReactNode } from "react";
import Image from "next/image";

import appConfig from "@/lib/appConfig";

type AuthSplitLayoutProps = {
  children: ReactNode;
};

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <section className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-8 lg:w-1/2 lg:py-12 lg:pl-10 lg:pr-8 xl:pl-16 xl:pr-12">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </section>

      <section className="relative flex min-h-[240px] flex-1 flex-col items-center justify-center overflow-hidden border-t border-border bg-muted/40 px-8 py-10 lg:min-h-screen lg:w-1/2 lg:border-l lg:border-t-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/[0.07] via-muted/80 to-sidebar-accent/25"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-sidebar-accent/30 blur-3xl"
        />

        <div className="relative z-10 flex max-w-md flex-col items-center text-center">
          <Image
            src="/tmoe.svg"
            alt={appConfig.appName}
            width={226}
            height={131}
            priority
            className="h-auto w-[min(100%,14rem)] object-contain sm:w-[min(100%,16rem)]"
          />
          <p className="mt-6 max-w-sm text-muted-foreground text-sm leading-relaxed sm:text-base">
            Brand and publisher partnerships, streamlined in one place.
          </p>
        </div>
      </section>
    </div>
  );
}
