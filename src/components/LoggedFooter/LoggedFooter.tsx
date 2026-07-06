const LoggedFooter = () => {
  return (
    <footer className="mt-0 border-t border-[#f1e3b9] bg-[#fffaf1]/80 px-5 py-5 text-center text-xs text-[#7c9d72] backdrop-blur-md sm:px-8 sm:text-sm">
      <p>
        Minha Irya<span className="ml-0.5 text-xs">©</span> by{" "}
        <a
          href="https://clinicawhim.com.br/"
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block font-medium text-[#4a5d4f] underline underline-offset-2 hover:text-[#3a4d3f]"
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
