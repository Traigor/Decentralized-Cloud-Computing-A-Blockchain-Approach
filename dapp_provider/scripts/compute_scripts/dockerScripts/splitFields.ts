import * as fs from "fs";
const SEPERATOR = " ----- ";
export const splitFields = (): {
  verification: string;
  duration: number;
  time: number;
} => {
  const fields = fs.readFileSync("output.txt", "utf8").split("\n")[0];
  const javaFields = fields.split(SEPERATOR);
  const computation = javaFields[0];
  const verification = javaFields[1];
  const durationMS = parseInt(javaFields[2]);
  const timeMS = parseInt(javaFields[3]);
  const duration = Math.floor(durationMS / 1000);
  const time = Math.floor(timeMS / 1000);

  fs.writeFileSync("computationResult.txt", computation);
  return {
    // computation,
    verification,
    duration,
    time,
  };
};
