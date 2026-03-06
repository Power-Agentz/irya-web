import Button from "../Button/Button";
import iryaAvatar from "../../../assets/irya-de-frente.png";

type ChatOfferProps = {
  label?: string;
  avatarSrc?: string;
  message: string;
  priceLine: string;
  policyLine: string;
  ctaLabel: string;
  onClick: () => void;
  className?: string;
};

const ChatOffer = ({
  label = "Continuidade com a Irya",
  avatarSrc = iryaAvatar,
  message,
  priceLine,
  policyLine,
  ctaLabel,
  onClick,
  className = "",
}: ChatOfferProps) => {
  return (
    <section
      className={`rounded-2xl border border-[#d6e0c7] bg-gradient-to-br from-[#f8fced] via-[#f2f8e7] to-[#edf4e0] p-5 shadow-[0_14px_34px_rgba(24,28,20,0.12)] sm:p-6 ${className}`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="shrink-0">
          <div className="relative">
            <span className="irya-avatar-ring-outer pointer-events-none absolute inset-[-10px] rounded-full border border-[#79b56f]/55" />
            <span className="irya-avatar-ring-inner pointer-events-none absolute inset-[-5px] rounded-full border-2 border-[#79b56f]/70" />
            <span className="pointer-events-none absolute inset-[-1px] rounded-full shadow-[0_0_0_6px_rgba(121,181,111,0.16)]" />
            <img
              src={avatarSrc}
              alt="Avatar da Irya em destaque no card de orientação"
              className="relative h-16 w-16 rounded-full border-2 border-[#bfd0ae] object-cover object-[50%_22%] shadow-[0_10px_24px_rgba(70,93,57,0.2)] sm:h-20 sm:w-20 lg:h-24 lg:w-24"
            />
          </div>
          <p className="mt-1 text-center text-[10px] font-semibold tracking-[0.08em] text-[#607355]">
            IRYA
          </p>
        </div>

        <div className="w-full">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6d7a5d]">
            {label}
          </p>
          <div className="relative mt-2">
            <div className="absolute -left-2 top-5 h-4 w-4 rotate-45 border-b border-l border-[#dfe7d3] bg-white/90" />
            <div className="rounded-2xl border border-[#dfe7d3] bg-white/90 p-4 text-sm leading-relaxed text-[#4f5a45] shadow-[0_8px_18px_rgba(45,58,36,0.08)] sm:text-base">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6e7f61]">
                Irya
              </p>
              <p className="mt-2">{message}</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-[#3f4c36] sm:text-base">{priceLine}</p>
          <p className="mt-1 text-sm text-[#4f5548] sm:text-base">{policyLine}</p>
          <div className="mt-4">
            <Button
              onClick={onClick}
              variant="primary"
              label={ctaLabel}
              fullWidth={false}
              className="sm:whitespace-nowrap"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatOffer;
