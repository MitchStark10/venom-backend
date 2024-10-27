const SINGLE_DAY_IN_MILLIS = 24 * 60 * 60 * 1000;

export const getTomorrowDate = (startFromDate?: string) => getDateWithOffset(1, startFromDate);
  
  
export const getDateWithOffset = (offset: number, startFromDate?: string) => new Date(
    (startFromDate ? new Date(startFromDate) : new Date()).getTime() +
    (SINGLE_DAY_IN_MILLIS * offset)
  );
