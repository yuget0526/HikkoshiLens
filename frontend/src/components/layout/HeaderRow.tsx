"use client";

import React from "react";

type HeaderRowProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function HeaderRow({ left, right }: HeaderRowProps) {
  return (
    <div className="w-full px-4 py-4">
      <nav className="flex items-center justify-between">
        <div className="flex items-center">{left}</div>
        <div className="flex items-center gap-4">{right}</div>
      </nav>
    </div>
  );
}
