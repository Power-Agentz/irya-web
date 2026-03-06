import type { ReactNode } from "react";

import BrandLogo from "../BrandLogo/BrandLogo";
import iryaAvatar from "../../../assets/irya-de-frente.png";

interface AuthLayoutProps {
  children: ReactNode;
  title?: ReactNode;
}

const moodboardBackground =
  "radial-gradient(1000px 520px at 15% -5%, rgba(255, 255, 255, 0.72), transparent 60%), radial-gradient(700px 440px at 92% 18%, rgba(209, 191, 156, 0.34), transparent 62%), radial-gradient(760px 520px at 62% 92%, rgba(131, 155, 124, 0.2), transparent 65%), linear-gradient(140deg, rgba(244, 246, 239, 1) 0%, rgba(237, 241, 231, 1) 46%, rgba(233, 225, 209, 1) 100%)";

const AuthLayout = ({ children, title }: AuthLayoutProps) => {
  return (
    <main className="w-full bg-[#FDFCF9]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1320px] overflow-hidden md:min-h-[calc(100dvh-4rem)] md:h-full md:border md:border-[#ece6d9] md:shadow-[0_24px_70px_rgba(26,30,23,0.08)]">
        <section
          className="relative hidden w-3/5 overflow-hidden bg-[#eff2e8] lg:block"
          style={{
            backgroundImage: moodboardBackground,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.56),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(188,166,121,0.22),transparent_40%)]" />
          <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-white/35 blur-3xl" />
          <div className="absolute bottom-8 right-8 h-56 w-56 rounded-full bg-[#93a686]/28 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
            <img
              src={iryaAvatar}
              alt="Irya em posição frontal na área de autenticação"
              className="h-[74vh] max-h-[760px] w-auto object-contain drop-shadow-[0_18px_36px_rgba(28,34,23,0.18)]"
            />
          </div>
        </section>

        <section className="relative flex w-full flex-col bg-[#FDFCF9]/92 backdrop-blur-xl lg:w-2/5 lg:border-l lg:border-[#ece6d9]">
          <div
            className="relative -mx-6 h-[36vh] min-h-[240px] max-h-[250px] overflow-hidden border-b border-[#ece6d9] sm:-mx-10 sm:mb-10 lg:hidden"
            style={{
              backgroundImage: moodboardBackground,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.56),transparent_45%),radial-gradient(circle_at_82%_74%,rgba(188,166,121,0.22),transparent_40%)]" />
            <div className="absolute left-4 top-4 h-40 w-40 rounded-full bg-white/35 blur-3xl sm:left-8 sm:top-6" />
            <div className="absolute bottom-4 right-4 h-36 w-36 rounded-full bg-[#93a686]/28 blur-3xl sm:bottom-5 sm:right-8" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
              <img
                src={iryaAvatar}
                alt="Irya em posição frontal na área de autenticação"
                className="h-[31vh] min-h-[190px] max-h-[300px] w-auto object-contain drop-shadow-[0_16px_32px_rgba(28,34,23,0.18)]"
              />
            </div>
          </div>
          <div className="relative z-10 -mt-5 mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center rounded-t-[30px] bg-[#FDFCF9]/96 px-6 py-8 sm:-mt-6 sm:px-10 sm:py-10 lg:mt-0 lg:rounded-none lg:bg-transparent lg:px-12 lg:py-10">
            <BrandLogo className="mb-2 sm:mb-10" />

            {title && (
              <h1 className="text-center font-['Iowan_Old_Style','Georgia',serif] text-[1.02rem] font-medium tracking-tight text-[#5f6d54] sm:text-[1.3rem]">
                {title}
              </h1>
            )}

            {children}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthLayout;
