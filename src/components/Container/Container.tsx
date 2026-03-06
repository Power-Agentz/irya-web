import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  hasHeader?: boolean;
}

const Container = ({ children, hasHeader = true }: ContainerProps) => {
  return (
    <main className="w-full bg-[radial-gradient(1200px_520px_at_8%_-8%,rgba(156,178,138,0.14),transparent_62%),radial-gradient(900px_460px_at_92%_15%,rgba(214,190,147,0.12),transparent_65%),linear-gradient(180deg,#f9faf6_0%,#f6f8f2_46%,#f4f6ef_100%)]">
      <div
        className={`relative flex w-full flex-col overflow-visible from-[#fdfcf9] via-[#fbfaf6] to-[#f7f3ea] ${
          hasHeader ? "min-h-[calc(100dvh-88px)]" : "min-h-dvh"
        } px-5 py-6 sm:px-8 md:min-h-0 md:px-10 md:py-12 lg:px-12`}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
          <div className="absolute -top-12 right-[8%] h-52 w-52 rounded-full bg-[#d9c8a6]/18 blur-3xl" />
          <div className="absolute bottom-0 left-[3%] h-60 w-60 rounded-full bg-[#95a788]/16 blur-3xl" />
        </div>
        {children}
      </div>
    </main>
  );
};

export default Container;
