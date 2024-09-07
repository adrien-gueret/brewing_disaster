export function goToSection(section: string): void;

export default function init(
  callback: (params: {
    nextSection: string;
    currentSection: string;
    vars: Record<string, any>;
  }) => boolean | void
);
