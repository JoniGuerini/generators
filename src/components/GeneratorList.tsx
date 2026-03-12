import { GENERATOR_IDS } from "@/engine/constants";
import { GeneratorRow } from "./GeneratorRow";

export function GeneratorList() {
  return (
    <ul className="flex min-w-0 flex-col gap-3">
      {GENERATOR_IDS.map((id) => (
        <li key={id}>
          <GeneratorRow id={id} />
        </li>
      ))}
    </ul>
  );
}
