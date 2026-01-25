import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";

interface Props {
  label: string;
  onClick: () => void;
}

export function SubTitle({ label, onClick }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4">
      <h2 className="flex text-lg font-semibold text-black">{label}</h2>
      <IconButton onClick={onClick}>
        <AddIcon />
      </IconButton>
    </div>
  );
}
