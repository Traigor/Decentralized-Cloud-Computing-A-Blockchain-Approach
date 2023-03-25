#!/bin/bash
ipfs init --profile=lowpower
wget https://dist.ipfs.tech/kubo/v0.19.0/kubo_v0.19.0_linux-arm64.tar.gz
tar -xvzf kubo_v0.19.0_linux-arm64.tar.gz
cd kubo
./install.sh
ipfs --version
cd ..
ipfs init
# ipfs daemon