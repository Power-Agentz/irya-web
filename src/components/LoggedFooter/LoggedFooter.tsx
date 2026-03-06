const LoggedFooter = () => {
  return (
    <footer className="mt-0 border-t border-[#dbe3d1] bg-[#f6f9f2]/85 px-5 py-5 text-center text-xs text-[#637159] sm:px-8 sm:text-sm">
      <p>
        Portal Irya by Clinica Whim. Todos os direitos reservados.
      </p>
      <a
        href="https://clinicawhim.com.br/"
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-block font-medium text-[#54674a] underline underline-offset-2 hover:text-[#43543b]"
      >
        clinicawhim.com.br
      </a>
    </footer>
  );
};

export default LoggedFooter;
