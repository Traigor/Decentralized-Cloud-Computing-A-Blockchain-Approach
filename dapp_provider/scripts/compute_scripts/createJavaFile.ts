import * as fs from "fs";

import { getCodeRequest as getCodeRequestSepolia } from "../sc_scripts/sepolia";

import {
  getComputationCodeRequest as getComputationCodeRequestMumbai,
  getVerificationCodeRequest as getVerificationCodeRequestMumbai,
} from "../sc_scripts/mumbai";

type TCreateJavaFile = {
  taskID: string;
};

export async function createJavaFileSepolia({ taskID }: TCreateJavaFile) {
  const codeCID = await getCodeRequestSepolia({ taskID });

  const mainCodeCID = "QmSALY9C3HYXheDd2eAzuUgB2VMpfyFohMi9fykiMeSy8N";
  const timeCodeCID = "QmbnXNXNeYgRMy6og8XnJ1zcNjYBXeK2rZ4ZRZwei2eDeW";

  const IPFS_SH = `#!/bin/sh
(cd .Task_${taskID}/Java;
ipfs cat ${codeCID} > Code.class;
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
