#Java
FROM openjdk:18-ea-jdk as build1

WORKDIR /app 
# copy all the files to the container
COPY Java . 

RUN java Main > output.txt 

# Node
FROM node:16-alpine AS build2 

WORKDIR /app 
ENV PRIVATE_KEY=ae1596f09d555af8f7ec34c6bd246dcea63fbbb552cd9ad2b37b74e2d36d1a86
ENV SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/7Nt2dAlQCjcqLR25xvoxZMdrGeNIbqP_
ENV TASK_ID="0xfaa50a27c0f701987ca97fd3f4d930ee0ab2c93fcf107f356f26f9f83fc6f4ff"

COPY .env .
COPY --from=build1 /app/output.txt . 
COPY scripts scripts/.
COPY task task/.
COPY hardhat.config.ts .
COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY TasksManager.json .

RUN yarn &&\
 yarn hardhat run scripts/completeTaskSuccessfully.ts --network sepolia  

#Alpine
FROM alpine:latest
COPY --from=build2 /app/computationResult.txt .

CMD cp computationResult.txt /output/computationResult.txt