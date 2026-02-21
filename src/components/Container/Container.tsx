import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  hasHeader?: boolean;
}

const Container = ({ children, hasHeader = true }: ContainerProps) => {
  return (
    <main className="mx-auto w-full max-w-[960px] px-0 md:px-6">
      <div
        className={`relative flex w-full flex-col overflow-hidden bg-gradient-to-b from-[#f7f5f0] via-[#f6f4ef] to-[#f2f0e8] ${
          hasHeader ? "min-h-[calc(100dvh-88px)]" : "min-h-dvh"
        } px-5 py-6 sm:px-6 md:min-h-0 md:rounded-[28px] md:border md:border-white/60 md:px-10 md:py-16 md:shadow-[0_18px_48px_rgba(28,30,25,0.18)]`}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
          <div className="absolute -top-10 right-0 h-44 w-44 rounded-full bg-[#d4c39c]/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-[#8d9d82]/22 blur-3xl" />
        </div>
        {children}
      </div>
    </main>
  );
};

export default Container;
