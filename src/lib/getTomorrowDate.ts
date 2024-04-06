export const getTomorrowDate = (startFromDate?: string) =>
  new Date(
    (startFromDate ? new Date(startFromDate) : new Date()).getTime() +
      24 * 60 * 60 * 1000
  );
