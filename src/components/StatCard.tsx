import { ReactNode } from "react";

export const StatCard = ({ label, value, tone, children }: { label: string; value: ReactNode; tone?: string; children?: ReactNode }) => (
  <section className={`stat ${tone || ""}`}>
    <small>{label}</small>
    <strong>{value}</strong>
    {children ? <span>{children}</span> : null}
  </section>
);
