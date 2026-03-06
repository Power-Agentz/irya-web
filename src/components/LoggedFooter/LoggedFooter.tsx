const LoggedFooter = () => {
  return (
    <footer className="mt-0 border-t border-[#dbe3d1] bg-[#f6f9f2]/85 px-5 py-5 text-center text-xs text-[#637159] sm:px-8 sm:text-sm">
      <p>
        Minha Irya<span className="ml-0.5 text-xs">©</span> by{" "}
        <a
          href="https://clinicawhim.com.br/"
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block font-medium text-[#54674a] underline underline-offset-2 hover:text-[#43543b]"
        >
          Clínica WHIM
        </a>
        . <br />
        Todos os direitos reservados.
      </p>
    </footer>
  );
};

export default LoggedFooter;
