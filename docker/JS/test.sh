#!/bin/sh
docker build -t test .
docker run -d -t test > id.txt 
value=$(<id.txt)
docker exec -dit $value ipfs daemon 
#docker exec -it $value bash
ipfs cat QmWtTqmcd8HS5aYfV7QXLEeBGLSn674wzJ6LCYnohAYDCv > main.js
node index.js > output.txt
ipfs add output.txt
rm id.txt
rm output.txt
rm main.js
