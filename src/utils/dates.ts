export const todayIso = () => new Date().toISOString().slice(0, 10);

export const daysUntil = (date: string) => {
  const now = new Date();
  const target = new Date(`${date}T00:00:00`);
  const ms = target.getTime() - new Date(now.toISOString().slice(0, 10)).getTime();
  return Math.ceil(ms / 86_400_000);
};

export const expiryWindow = (date: string) => {
  const days = daysUntil(date);
  if (days < 0) return "caducado";
  if (days <= 30) return "30 días";
  if (days <= 60) return "60 días";
  if (days <= 90) return "90 días";
  return "";
};
