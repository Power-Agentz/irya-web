import type { ReactNode } from "react";
import "./Container.css";

interface ContainerProps {
  children: ReactNode;
  hasHeader?: boolean;
}

const Container = ({ children, hasHeader = true }: ContainerProps) => {
  return (
    <div className={`container ${!hasHeader ? "non-header" : ""}`}>
      <div className="container-wrapper">{children}</div>
    </div>
  );
};

export default Container;
