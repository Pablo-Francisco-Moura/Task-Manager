import { IconButton } from "@mui/material";
import { UseFormRegister } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  title: string;
  placeholder: string;
  submitLabel: string;
  error?: string | null;
  isSubmitting?: boolean;
  register: UseFormRegister<any>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose?: () => void;
}

export function Form({
  title,
  error,
  placeholder,
  submitLabel,
  isSubmitting,
  onClose,
  onSubmit,
  register,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 w-full max-w-md p-4 bg-white rounded shadow"
    >
      <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
        <label className="font-medium text-gray-700">{title}</label>
        {onClose && (
          <IconButton color="error" onClick={onClose} className="mb-4">
            <CloseIcon />
          </IconButton>
        )}
      </div>

      <input
        id="name"
        type="text"
        {...register("name", { required: "Nome é obrigatório" })}
        disabled={isSubmitting}
        className="text-black border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Salvando..." : submitLabel}
      </button>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </form>
  );
}
