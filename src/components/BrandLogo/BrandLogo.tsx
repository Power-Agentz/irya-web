import logo from "../../../assets/logo-irya.png";

interface BrandLogoProps {
  className?: string;
}

const BrandLogo = ({ className = "" }: BrandLogoProps) => {
  return (
    <div className={`flex justify-center ${className}`.trim()}>
      <img
        src={logo}
        alt="Logo da Minha Irya"
        width={7656}
        height={3616}
        className="h-[84px] w-auto sm:h-[96px]"
      />
    </div>
  );
};

export default BrandLogo;
