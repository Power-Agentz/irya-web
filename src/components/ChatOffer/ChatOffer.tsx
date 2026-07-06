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
  label = "",
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
      className={`rounded-[32px] border border-[#f1e3b9] bg-[linear-gradient(135deg,rgba(255,255,255,0.94)_0%,rgba(244,238,216,0.76)_100%)] p-5 shadow-[0_8px_32px_rgba(74,93,79,0.16)] backdrop-blur-md sm:p-6 ${className}`}
    >
      <div className="flex items-start gap-3 flex-col sm:gap-4 sm:flex-row">
        <div className="shrink-0">
          <div className="relative">
            <span className="irya-avatar-ring-outer pointer-events-none absolute inset-[-10px] rounded-full border border-[#7c9d72]/45" />
            <span className="irya-avatar-ring-inner pointer-events-none absolute inset-[-5px] rounded-full border-2 border-[#7c9d72]/55" />
            <span className="pointer-events-none absolute inset-[-1px] rounded-full shadow-[0_0_0_6px_rgba(124,157,114,0.14)]" />
            <img
              src={avatarSrc}
              alt="Avatar da Irya em destaque no card de orientação"
              className="relative h-20 w-20 rounded-full border-2 border-[#e4c884] object-cover object-[50%_22%] shadow-[0_10px_24px_rgba(74,93,79,0.18)] sm:h-24 sm:w-24 lg:h-28 lg:w-28"
            />
          </div>
        </div>

        <div className="w-full">
          <p className="irya-section-label">
            {label}
          </p>
          <div className="relative mt-2">
            <div className="absolute left-6 -top-2 h-4 w-4 rotate-45 border-l border-t border-[#f1e3b9] bg-white/92 sm:hidden" />
            <div className="absolute -left-2 top-5 hidden h-4 w-4 rotate-45 border-b border-l border-[#f1e3b9] bg-white/92 sm:block" />
            <div className="rounded-[24px] border border-[#f1e3b9] bg-white/92 p-4 text-sm leading-relaxed text-[#4a5d4f] shadow-[0_4px_16px_rgba(74,93,79,0.12)] sm:text-base">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7c9d72]">
                Irya
              </p>
              <p className="mt-2">{message}</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-[#4a5d4f] sm:text-base">{priceLine}</p>
          <p className="mt-1 text-sm text-[#7c9d72] sm:text-base">{policyLine}</p>
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
