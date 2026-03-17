import { useGameSelector } from "@/store/useGameStore";
import { getVisibleGeneratorIds } from "@/store/gameState";
import { GeneratorRow } from "./GeneratorRow";

export function GeneratorList() {
  const visibleIds = useGameSelector(getVisibleGeneratorIds, (a, b) => a.join() === b.join());
  return (
    <ul className="flex min-w-0 flex-col gap-3">
      {visibleIds.map((id) => (
        <li key={id}>
          <GeneratorRow id={id} />
        </li>
      ))}
    </ul>
  );
}
