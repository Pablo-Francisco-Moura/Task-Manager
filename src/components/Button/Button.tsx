interface Props {
  label: string;
  full?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function Button({ label, full, disabled, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${full || full === undefined ? "w-full" : ""} h-10 flex justify-center items-center border-2 rounded px-6 py-2 text-base font-semibold transition-colors duration-150 border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100`}
    >
      {label}
    </button>
  );
}
