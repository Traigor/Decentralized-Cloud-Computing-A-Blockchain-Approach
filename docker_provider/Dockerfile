# FROM node:16-alpine

# COPY . .

# RUN yarn &&\
#  chmod -R 777 run.sh &&\
#  yarn hardhat run scripts/getPerformance.ts  > performance.txt 

# CMD ["cat", "performance.txt"]

# #Java
# FROM openjdk:18-ea-jdk as build1

# WORKDIR /app
# # copy all the files to the container
# COPY Java .

# RUN java Main > output.txt

#Node
FROM node:16-alpine AS build2

WORKDIR /app
COPY . .

RUN yarn &&\
 yarn hardhat run scripts/completeTaskSuccessfully.ts  > performance.txt 

# #Alpine
# FROM alpine:3.14
# COPY --from=build1 /app/output.txt .
# COPY --from=build2 /app/performance.txt .
# COPY cat.sh .

# RUN chmod -R 777 cat.sh 

# CMD ./cat.sh
