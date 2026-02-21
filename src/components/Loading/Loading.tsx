import React from "react";

const dotPositions = [
  "top-0 left-1/2 -translate-x-1/2",
  "left-0 top-1/2 -translate-y-1/2",
  "right-0 top-1/2 -translate-y-1/2",
  "bottom-0 left-1/2 -translate-x-1/2",
];

const Loading: React.FC = () => {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center py-10">
      <div className="relative h-12 w-12 animate-[spin_1s_linear_infinite] sm:h-14 sm:w-14">
        {dotPositions.map((position) => (
          <span
            key={position}
            className={`absolute h-2.5 w-2.5 rounded-full bg-[#87967a] sm:h-3 sm:w-3 ${position}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Loading;
