export function Spinner() {
  return (
    <div className="flex size-10 gap-1 animate-spin relative rounded-full overflow-hidden">
      <div className="flex-1 rounded-full bg-foreground" />
      <div className="flex-1 rounded-full bg-foreground" />
      <div className="absolute size-2/3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black rounded-full" />
    </div>
  );
}
