

#Java
FROM openjdk:18-ea-jdk as build1

WORKDIR /app 
# copy all the files to the container
COPY Java . 

RUN java Main > output.txt 

# Node
FROM node:16-alpine AS build2 

WORKDIR /app 
COPY --from=build1 /app/output.txt . 
COPY scripts scripts/.
COPY hardhat.config.ts .
COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY splitFields.ts .
COPY TasksManager.json .
COPY .env .

RUN yarn &&\
 yarn hardhat run scripts/completeTaskSuccessfully.ts --network sepolia  

#Alpine
FROM alpine:latest
COPY --from=build2 /app/computationResult.txt .

CMD cp computationResult.txt /output/computationResult.txt