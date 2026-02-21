import logo from "../../../assets/logo-irya.png";

interface BrandLogoProps {
  className?: string;
}

const BrandLogo = ({ className = "" }: BrandLogoProps) => {
  return (
    <div className={`flex justify-center ${className}`.trim()}>
      <img src={logo} alt="Irya Logo" className="h-[140px] w-auto sm:h-[110px]" />
    </div>
  );
};

export default BrandLogo;
