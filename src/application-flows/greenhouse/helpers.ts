import { format, addMinutes } from "date-fns";

export const filterTimesEmail = () => {
  const now = new Date();
  return [0, 1, 2, 3].map((m) => format(addMinutes(now, m), "HH:mm")).join("|");
};
