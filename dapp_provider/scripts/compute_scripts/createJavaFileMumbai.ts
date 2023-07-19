import * as fs from "fs";

import {
  getComputationCodeRequest,
  getVerificationCodeRequest,
} from "../sc_scripts/mumbai";

type TCreateJavaFile = {
  taskID: string;
};

export async function createJavaFileMumbai({ taskID }: TCreateJavaFile) {
  const computationCodeCID = await getComputationCodeRequest({ taskID });
  const verificationCodeCID = await getVerificationCodeRequest({ taskID });
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
