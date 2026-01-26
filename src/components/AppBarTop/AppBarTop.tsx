import { appTitle } from "@/constants/app";

export function AppBarTop() {
  return (
    <header className="w-full bg-blue-600 shadow-md">
      <div className="container mx-auto py-3 ml-4 flex items-start">
        <h1 className="text-white text-lg font-bold tracking-wide">
          {appTitle}
        </h1>
      </div>
    </header>
  );
}
