import { main, verification } from "./main.js";
const date1 = new Date();

main();
verification();

const date2 = new Date();

console.log("Time [ms]: " + (date2 - date1));
