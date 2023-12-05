import * as fs from "fs";

import { getCodeRequest as getCodeRequestSepolia } from "../sc_scripts/sepolia";

import { getCodeRequest as getCodeRequestMumbai } from "../sc_scripts/mumbai";

type TCreateJavaFile = {
  taskID: string;
};

export async function createJavaFileSepolia({ taskID }: TCreateJavaFile) {
  const codeCID = await getCodeRequestSepolia({ taskID });
  console.log("Code CID:", codeCID);

  const mainCodeCID = "QmWzMCNderiptFM7rksAZdyUvDUNj5sEpAX5tibjJjGyKB";
  const timeCodeCID = "QmYCK97zguaBzWwTCgCT3LEB7aotXYuQAWoMVL6jMjXRTC";

  // Client will provide jar file with code and possible and files if needed
  const IPFS_SH = `#!/bin/sh
(cd .Task_${taskID}/Java;
ipfs cat ${codeCID} > jar-file.jar;
ipfs cat ${mainCodeCID} > Main.class;
ipfs cat ${timeCodeCID} > Time.class;
jar -xf jar-file.jar;)`;

  if (!fs.existsSync(`.Task_${taskID}/Java`)) {
    fs.mkdirSync(`.Task_${taskID}/Java`);
  }
  fs.writeFileSync(`.Task_${taskID}/Java/ipfs.sh`, IPFS_SH);
}

export async function createJavaFileMumbai({ taskID }: TCreateJavaFile) {
  const codeCID = await getCodeRequestMumbai({ taskID });

  const mainCodeCID = "QmWzMCNderiptFM7rksAZdyUvDUNj5sEpAX5tibjJjGyKB";
  const timeCodeCID = "QmYCK97zguaBzWwTCgCT3LEB7aotXYuQAWoMVL6jMjXRTC";

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
