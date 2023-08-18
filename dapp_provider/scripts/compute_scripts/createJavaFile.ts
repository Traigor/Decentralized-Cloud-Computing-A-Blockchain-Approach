import * as fs from "fs";

import { getCodeRequest as getCodeRequestSepolia } from "../sc_scripts/sepolia";

import { getCodeRequest as getCodeRequestMumbai } from "../sc_scripts/mumbai";

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
  const codeCID = await getCodeRequestMumbai({ taskID });

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
