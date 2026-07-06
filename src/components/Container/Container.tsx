import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  hasHeader?: boolean;
}

const Container = ({ children, hasHeader = true }: ContainerProps) => {
  return (
    <main className="w-full bg-[radial-gradient(980px_520px_at_12%_-8%,rgba(234,207,147,0.2),transparent_60%),radial-gradient(760px_420px_at_90%_10%,rgba(124,157,114,0.1),transparent_60%),linear-gradient(180deg,#fffefb_0%,#fbf8f0_46%,#f8f3e8_100%)]">
      <div
        className={`relative flex w-full flex-col overflow-visible ${
          hasHeader ? "min-h-[calc(100dvh-88px)]" : "min-h-dvh"
        } px-5 py-6 sm:px-8 md:min-h-0 md:px-10 md:py-10 lg:px-12`}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
          <div className="absolute -top-14 right-[8%] h-56 w-56 rounded-full bg-[#eacf93]/16 blur-3xl" />
          <div className="absolute bottom-[10%] left-[4%] h-64 w-64 rounded-full bg-[#7c9d72]/10 blur-3xl" />
        </div>
        {children}
      </div>
    </main>
  );
};

export default Container;
