# FROM node:16-alpine

# COPY . .

# RUN yarn &&\
#  chmod -R 777 run.sh &&\
#  yarn hardhat run scripts/getPerformance.ts  > performance.txt 

# CMD ["cat", "performance.txt"]

FROM node:16-alpine AS build1

WORKDIR /app
COPY . .

RUN yarn &&\
 yarn hardhat run scripts/getPerformance.ts  > performance.txt 


FROM openjdk:18-ea-jdk as build2

WORKDIR /app
# copy all the files to the container
COPY Main.jar .

RUN java -jar Main.jar > output.txt


FROM alpine:3.14
COPY --from=build1 /app/performance.txt .
COPY --from=build2 /app/output.txt .
COPY cat.sh .

RUN chmod -R 777 cat.sh 

CMD ./cat.sh
