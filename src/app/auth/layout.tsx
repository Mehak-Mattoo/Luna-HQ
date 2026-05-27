import React from "react";

type Props = {
  children: React.ReactNode;
};

const layout = ({ children }: Props) => {
  return (
    <div className="flex h-svh  items-center justify-center gap-2">
      <div className="w-1/3 flex  items-center justify-center ">
        <h3>Welcome</h3>
      </div>
      {children}
    </div>
  );
};

export default layout;
