import * as fs from "fs";

import {
  getComputationCodeRequest as getComputationCodeRequestSepolia,
  getVerificationCodeRequest as getVerificationCodeRequestSepolia,
} from "../sc_scripts/sepolia";

import {
  getComputationCodeRequest as getComputationCodeRequestMumbai,
  getVerificationCodeRequest as getVerificationCodeRequestMumbai,
} from "../sc_scripts/mumbai";

type TCreateJavaFile = {
  taskID: string;
};

export async function createJavaFileSepolia({ taskID }: TCreateJavaFile) {
  const computationCodeCID = await getComputationCodeRequestSepolia({ taskID });
  const verificationCodeCID = await getVerificationCodeRequestSepolia({
    taskID,
  });
  const mainCodeCID = "QmdVDxE9gg9LDWUdvqiC1mL2FcDuh2ZW7jsXikYYNFtqdo";
  const timeCodeCID = "QmZLwiQXCD7JjCxPNnD1UC9FHzZRucvdxZM3qnb5XzgUyt";

  const IPFS_SH = `#!/bin/sh
(cd .Task_${taskID}/Java;
ipfs cat ${computationCodeCID} > Computation.class;
ipfs cat ${verificationCodeCID} > Verification.class;
ipfs cat ${mainCodeCID} > Main.class;
ipfs cat ${timeCodeCID} > Time.class;)`;

  if (!fs.existsSync(`.Task_${taskID}/Java`)) {
    fs.mkdirSync(`.Task_${taskID}/Java`);
  }
  fs.writeFileSync(`.Task_${taskID}/Java/ipfs.sh`, IPFS_SH);
}

export async function createJavaFileMumbai({ taskID }: TCreateJavaFile) {
  const computationCodeCID = await getComputationCodeRequestMumbai({ taskID });
  const verificationCodeCID = await getVerificationCodeRequestMumbai({
    taskID,
  });
  const mainCodeCID = "QmdVDxE9gg9LDWUdvqiC1mL2FcDuh2ZW7jsXikYYNFtqdo";
  const timeCodeCID = "QmZLwiQXCD7JjCxPNnD1UC9FHzZRucvdxZM3qnb5XzgUyt";

  const IPFS_SH = `#!/bin/sh
(cd .Task_${taskID}/Java;
ipfs cat ${computationCodeCID} > Computation.class;
ipfs cat ${verificationCodeCID} > Verification.class;
ipfs cat ${mainCodeCID} > Main.class;
ipfs cat ${timeCodeCID} > Time.class;)`;

  if (!fs.existsSync(`.Task_${taskID}/Java`)) {
    fs.mkdirSync(`.Task_${taskID}/Java`);
  }
  fs.writeFileSync(`.Task_${taskID}/Java/ipfs.sh`, IPFS_SH);
}
