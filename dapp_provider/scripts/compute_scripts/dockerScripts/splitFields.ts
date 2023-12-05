import * as fs from "fs";
const SEPERATOR = " ----- ";
export const splitFields = (): {
  verification: string;
  duration: number;
  time: number;
} => {
  const fields = fs.readFileSync("output.txt", "utf8");
  const javaFields = fields.split(SEPERATOR);
  const computation = javaFields[0];
  const verification = javaFields[1];
  const duration = parseInt(javaFields[2]);
  const time = parseInt(javaFields[3]);

  fs.writeFileSync("computationResult.txt", computation);
  return {
    verification,
    duration,
    time,
  };
};
