#!/bin/sh
docker build -t test .
docker run -d -t test > container_id.txt 
value=$(<container_id.txt)
rm container_id.txt
docker exec -dit $value ipfs daemon 
sleep 1
docker exec $value ./run.sh
docker stop $value
docker rm $value
docker rmi test
