interface IProps {
  label: string;
  full?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function Button({ label, full, disabled, onClick }: IProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${full || full === undefined ? "w-full" : ""} h-10 flex justify-center items-center border-2 rounded px-6 py-2 text-base font-semibold transition-colors duration-150 border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}
