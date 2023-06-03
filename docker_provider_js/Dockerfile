# Java -> JS
# future: JS -> Java -> JS

# FROM openjdk:18-ea-jdk as build1

# WORKDIR /app
# # copy all the files to the container
# COPY Java .

# RUN java Main > output.txt

FROM node:16-alpine AS build2

WORKDIR /app
COPY . .

RUN yarn &&\
 yarn hardhat run scripts/getPerformance.js  > performance.txt 

# FROM node:16.17.0-alpine

# WORKDIR /app
# COPY . .

# RUN yarn &&\
# chmod -R 777 test.sh &&\
# npm i --location=global ipfs 

# CMD ./test.sh

# FROM alpine:3.14
# COPY --from=build1 /app/performance.txt .
# COPY --from=build2 /app/output.txt .
# COPY cat.sh .

# RUN chmod -R 777 cat.sh 

# CMD ./cat.sh