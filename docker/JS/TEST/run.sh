#!/bin/bash
ipfs cat QmXMBp7QSrLr9tcQpYC5hGn5MpGEZqLgSXX3fgvWe6fMvT > main.js
node index.js > output.txt
ipfs add output.txt