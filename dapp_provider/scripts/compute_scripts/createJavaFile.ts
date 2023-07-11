import * as fs from "fs";

import {
  getComputationCodeRequest,
  getVerificationCodeRequest,
} from "../sc_scripts";

type TCreateJavaFile = {
  taskID: string;
};

export async function createJavaFile({ taskID }: TCreateJavaFile) {
  const computationCodeCID = await getComputationCodeRequest({ taskID });
  const verificationCodeCID = await getVerificationCodeRequest({ taskID });
  const mainCodeCID = "Qmdxfy394uMUdw8KnM53jjTsoERi8EHruLxU7mgDvvDXzw";
  const timeCodeCID = "QmZLwiQXCD7JjCxPNnD1UC9FHzZRucvdxZM3qnb5XzgUyt";

  //TODO: change Java code and rename myFunction.class to Computation.class
  const IPFS_SH = `#!/bin/sh
(cd .Task_${taskID}/Java;
ipfs cat ${computationCodeCID} > myFunction.class;
ipfs cat ${verificationCodeCID} > Verification.class;
ipfs cat ${mainCodeCID} > Main.class;
ipfs cat ${timeCodeCID} > Time.class;)`;

  if (!fs.existsSync(`.Task_${taskID}/Java`)) {
    fs.mkdirSync(`.Task_${taskID}/Java`);
  }
  fs.writeFileSync(`.Task_${taskID}/Java/ipfs.sh`, IPFS_SH);
}
