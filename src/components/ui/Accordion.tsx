"use client";

import React, { useState } from "react";

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({ items, allowMultiple = false }) => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggleIndex = (index: number) => {
    if (allowMultiple) {
      if (openIndexes.includes(index)) {
        setOpenIndexes(openIndexes.filter((i) => i !== index));
      } else {
        setOpenIndexes([...openIndexes, index]);
      }
    } else {
      if (openIndexes.includes(index)) {
        setOpenIndexes([]);
      } else {
        setOpenIndexes([index]);
      }
    }
  };

  return (
    <div className="flex flex-col w-full border-t border-border-subtle select-none font-sans">
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index);
        return (
          <div key={index} className="border-b border-border-subtle">
            <button
              onClick={() => toggleIndex(index)}
              className="flex w-full items-center justify-between py-4 text-left font-sans text-sm font-medium tracking-wide uppercase text-text-primary focus:outline-none"
            >
              <span>{item.title}</span>
              <span className={`transform transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-quint ${
                isOpen ? "max-h-96 pb-4" : "max-h-0"
              }`}
            >
              <div className="text-sm font-light text-text-secondary leading-relaxed font-sans pr-4">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
