FROM node:18

# set a directory for the app
WORKDIR /usr/src/app    

COPY index.js .
COPY package.json .
COPY ipfs.sh .
COPY run.sh .

RUN chmod -R 777 *.sh &&\
    ./ipfs.sh 
    
