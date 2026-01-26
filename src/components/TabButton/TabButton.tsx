interface Props {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function TabButton({ label, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-10 flex border-2 rounded dark:bg-gray-600 px-6 py-2 text-sm font-semibold transition-colors duration-150
        ${selected ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 " : "border-gray-400 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"}
        hover:border-blue-600 hover:text-blue-600`}
    >
      {label}
    </button>
  );
}
