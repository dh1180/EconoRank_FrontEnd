"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense, useTransition } from "react";

type YearSelectProps = {
  id?: string;
  label: string;
  year: number | undefined;
  years: number[];
  preserveParams?: boolean;
};

function YearSelectInner({
  id = "year",
  label,
  year,
  years,
  preserveParams = true,
}: YearSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const sortedYears = [...new Set([...(year ? [year] : []), ...years])].sort(
    (a, b) => b - a,
  );

  function onChange(nextYear: string) {
    const params = preserveParams
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams();
    params.set("year", nextYear);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className={`year-select-wrap ${isPending ? "is-pending" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name="year"
        value={year ?? sortedYears[0] ?? ""}
        disabled={isPending}
        onChange={(e) => onChange(e.target.value)}
      >
        {sortedYears.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function YearSelect(props: YearSelectProps) {
  const sortedYears = [
    ...new Set([...(props.year ? [props.year] : []), ...props.years]),
  ].sort((a, b) => b - a);
  return (
    <Suspense
      fallback={
        <div className="year-select-wrap">
          <label htmlFor={props.id ?? "year"}>{props.label}</label>
          <select
            id={props.id ?? "year"}
            name="year"
            defaultValue={props.year ?? sortedYears[0] ?? ""}
          >
            {sortedYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <YearSelectInner {...props} />
    </Suspense>
  );
}
