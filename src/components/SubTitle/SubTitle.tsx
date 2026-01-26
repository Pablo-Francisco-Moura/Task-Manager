import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";

interface Props {
  label: string;
  onClick: () => void;
}

export function SubTitle({ label, onClick }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 px-4 pt-4">
      <h2 className="flex text-lg font-semibold text-black dark:text-gray-100">
        {label}
      </h2>
      <Tooltip arrow title={`${t("add")} ${label}`}>
        <IconButton onClick={onClick}>
          <AddIcon className="text-black dark:text-gray-100" />
        </IconButton>
      </Tooltip>
    </div>
  );
}
