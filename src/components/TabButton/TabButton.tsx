interface IProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function TabButton({ label, selected, onClick }: IProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "page" : undefined}
      className={`app-nav-button relative flex min-h-12 min-w-28 items-center justify-center px-5 text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        ${selected ? "app-nav-button-selected" : ""}`}
    >
      {label}
    </button>
  );
}
