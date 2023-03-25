FROM node:18

# set a directory for the app
WORKDIR /usr/src/app    

# copy all the files to the container
COPY index.js .
COPY package.json .
COPY ipfs.sh .


RUN chmod -R 777 *.sh &&\
    #curl -O https://ipfs.io/ipfs/QmWtTqmcd8HS5aYfV7QXLEeBGLSn674wzJ6LCYnohAYDCv?filename=main.js &&\
    #cp QmWtTqmcd8HS5aYfV7QXLEeBGLSn674wzJ6LCYnohAYDCv?filename=main.js main.js &&\
    ./ipfs.sh 
 #   ipfs cat QmWtTqmcd8HS5aYfV7QXLEeBGLSn674wzJ6LCYnohAYDCv > main.js
    
