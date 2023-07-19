import {
  createDockerfileAndShSepolia,
  createDockerfileAndShMumbai,
} from "./createDockerfileAndSh";
import { chmod } from "./chmod";
import { runSh } from "./runSh";
import { createJavaFileSepolia, createJavaFileMumbai } from "./createJavaFile";
import { addResultsToIpfs } from "./addResultsToIPFS";
export {
  createDockerfileAndShMumbai,
  createDockerfileAndShSepolia,
  createJavaFileSepolia,
  createJavaFileMumbai,
  chmod,
  runSh,
  addResultsToIpfs,
};
