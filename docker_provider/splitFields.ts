const SEPERATOR = " ----- ";
export const splitFields = (fields: string): string[] => {
  return fields.split(SEPERATOR);
};
