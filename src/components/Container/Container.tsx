import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  hasHeader?: boolean;
}

const Container = ({ children, hasHeader = true }: ContainerProps) => {
  return (
    <main className="mx-auto w-full max-w-[1320px] bg-[#FDFCF9] px-0 md:px-6">
      <div
        className={`relative flex w-full flex-col overflow-visible bg-gradient-to-b from-[#fdfcf9] via-[#fbfaf6] to-[#f7f3ea] ${
          hasHeader ? "min-h-[calc(100dvh-88px)]" : "min-h-dvh"
        } px-5 py-6 sm:px-8 md:min-h-0 md:px-10 md:py-12 lg:px-12`}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-80">
          <div className="absolute -top-12 right-[8%] h-52 w-52 rounded-full bg-[#d9c8a6]/26 blur-3xl" />
          <div className="absolute bottom-0 left-[3%] h-60 w-60 rounded-full bg-[#95a788]/20 blur-3xl" />
        </div>
        {children}
      </div>
    </main>
  );
};

export default Container;
