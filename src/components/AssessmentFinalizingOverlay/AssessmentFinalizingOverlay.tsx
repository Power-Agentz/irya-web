import { useEffect, useState } from "react";
import { FiActivity, FiHeart, FiTarget, FiZap } from "react-icons/fi";
import iryaReceptiva from "../../../assets/irya-receptiva.png";
import iryaSaudando from "../../../assets/irya-saudando.png";
import iryaPensando from "../../../assets/irya-pensando.png";
import iryaGrata from "../../../assets/irya-grata.png";

type AssessmentFinalizingOverlayProps = {
  visible: boolean;
};

const AVATARS = [
  {
    src: iryaReceptiva,
    alt: "Irya receptiva acompanhando o processamento da avaliação",
  },
  {
    src: iryaSaudando,
    alt: "Irya saudando durante a geração da leitura personalizada",
  },
  {
    src: iryaPensando,
    alt: "Irya pensando para montar os próximos passos da paciente",
  },
  {
    src: iryaGrata,
    alt: "Irya finalizando a leitura com expressão de acolhimento",
  },
];

const LOADING_MESSAGES = [
  "Estou avaliando o seu resultado...",
  "Estou entendendo os seus objetivos...",
  "Estou montando seus próximos passos...",
];

const floatingIcons = [
  { Icon: FiHeart, top: "16%", left: "22%", delay: "0s" },
  { Icon: FiTarget, top: "20%", right: "16%", delay: "0.3s" },
  { Icon: FiActivity, bottom: "14%", left: "16%", delay: "0.6s" },
  { Icon: FiZap, bottom: "18%", right: "22%", delay: "0.9s" },
] as const;

const AssessmentFinalizingOverlay = ({ visible }: AssessmentFinalizingOverlayProps) => {
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setAvatarIndex(0);
      setMessageIndex(0);
      return;
    }

    const avatarTimer = window.setInterval(() => {
      setAvatarIndex((previous) => (previous + 1) % AVATARS.length);
    }, 1200);

    const messageTimer = window.setInterval(() => {
      setMessageIndex((previous) => (previous + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => {
      window.clearInterval(avatarTimer);
      window.clearInterval(messageTimer);
    };
  }, [visible]);

  return (
    <div
      className={`fixed inset-0 z-[140] flex items-center justify-center bg-[#12210f]/62 px-5 backdrop-blur-[2.5px] transition-opacity duration-300 ${
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <section className="relative w-full max-w-[500px] overflow-hidden rounded-3xl border border-[#d7e2c9] bg-gradient-to-br from-[#f9fcf3] via-[#f2f8e9] to-[#eaf3de] p-7 text-center shadow-[0_30px_80px_rgba(14,23,10,0.42)] sm:p-9">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-3 h-32 w-32 rounded-full bg-[#b5c7a1]/20 blur-3xl" />
          <div className="absolute -right-10 bottom-2 h-32 w-32 rounded-full bg-[#d4c093]/20 blur-3xl" />
        </div>

        <div className="relative mx-auto h-44 w-44 sm:h-48 sm:w-48">
          <div className="pointer-events-none absolute inset-[-12px] rounded-full border border-[#89a079]/35" />
          <div className="pointer-events-none absolute inset-[-4px] rounded-full border-2 border-dashed border-[#89a079]/65 animate-spin [animation-duration:6.2s]" />

          {floatingIcons.map(({ Icon, delay, ...position }, index) => (
            <span
              key={index}
              className="irya-loading-float pointer-events-none absolute flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#6f8760] shadow-[0_8px_16px_rgba(40,53,31,0.16)]"
              style={{ ...position, animationDelay: delay }}
            >
              <Icon className="h-4 w-4" />
            </span>
          ))}

          <div className="irya-loading-avatar relative h-full w-full overflow-hidden rounded-full border-[5px] border-white/90 bg-[#eef4e5] shadow-[0_18px_34px_rgba(24,34,18,0.24)]">
            {AVATARS.map((avatar, index) => (
              <img
                key={avatar.src}
                src={avatar.src}
                alt={avatar.alt}
                className={`absolute inset-0 h-full w-full object-cover object-[50%_22%] transition-opacity duration-500 ${
                  index === avatarIndex ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.15em] text-[#6d7a5d] sm:mt-7">
          Irya analisando sua avaliação
        </p>

        <p className="mt-2 min-h-[56px] text-xl font-semibold leading-tight text-[#3f4c36] sm:text-2xl">
          {LOADING_MESSAGES[messageIndex]}
        </p>

        <div className="mt-4 h-2.5 rounded-full bg-white/70 p-[2px]">
          <div className="irya-loading-bar h-full rounded-full bg-gradient-to-r from-[#8fa47f] via-[#a4b894] to-[#8fa47f]" />
        </div>

        <p className="mt-4 text-sm text-[#536347]">Preparando sua leitura personalizada.</p>
      </section>
    </div>
  );
};

export default AssessmentFinalizingOverlay;
