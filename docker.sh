#!/bin/sh
if [ $# -eq 0 ]
  then
    docker build -t test .
  else
    docker build -t test --build-arg seed="$*" .
fi
docker run test
