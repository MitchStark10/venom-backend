export const getDayWithoutTime = (givenDate = new Date()): Date => {
  const offset = givenDate.getTimezoneOffset();
  givenDate = new Date(givenDate.getTime() - offset * 60 * 1000);
  return new Date(givenDate.toISOString().split("T")[0]);
};
