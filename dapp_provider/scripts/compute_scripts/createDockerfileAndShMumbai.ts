import * as fs from "fs";

type TCreateDockerfile = {
  taskID: string;
  privateKey: string;
};
export async function createDockerfileAndShMumbai({
  taskID,
  privateKey,
}: TCreateDockerfile) {
  //maybe download from ipfs
  const DOCKERFILE = `
  #Java
FROM openjdk:18-ea-jdk as build1

WORKDIR /app 
# copy all the files to the container
COPY .Task_${taskID}/Java . 

RUN java Main > output.txt 

# Node
FROM node:16-alpine AS build2 

WORKDIR /app 
ENV PRIVATE_KEY=${privateKey}
ENV MUMBAI_RPC_URL="https://polygon-mumbai.g.alchemy.com/v2/TVXTOZsHJADm6glt6owcssGtDkSFAuku"
ENV SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/7Nt2dAlQCjcqLR25xvoxZMdrGeNIbqP_"
ENV TASK_ID=${taskID}

COPY --from=build1 /app/output.txt . 
COPY scripts/compute_scripts/dockerScripts scripts/.
COPY .Task_${taskID} .Task_${taskID}/.
COPY hardhat.config.ts .
COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY TasksManagerMumbai.json TasksManager.json

RUN yarn &&\
 yarn hardhat run scripts/completeTask.ts --network mumbai  

#Alpine
FROM alpine:latest
COPY --from=build2 /app/computationResult.txt .

CMD cp computationResult.txt /output/${taskID}.txt`;

  const COMPUTE_TASK_SH = `#!/bin/sh
docker build --no-cache -t ${taskID} -f .Task_${taskID}/Dockerfile .
docker run --rm -v $(pwd)/.Task_${taskID}/output:/output ${taskID}
(cd $(pwd)/.Task_${taskID}; rm -rf Java; rm Dockerfile; rm computeTask.sh;)`;

  if (!fs.existsSync(`.Task_${taskID}`)) {
    fs.mkdirSync(`.Task_${taskID}`);
  }
  fs.writeFileSync(`.Task_${taskID}/Dockerfile`, DOCKERFILE);
  fs.writeFileSync(`.Task_${taskID}/computeTask.sh`, COMPUTE_TASK_SH);
}
