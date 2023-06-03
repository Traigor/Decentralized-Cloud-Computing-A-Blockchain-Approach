#!/bin/bash
wget https://dist.ipfs.tech/kubo/v0.19.0/kubo_v0.19.0_linux-arm64.tar.gz
tar -xvzf kubo_v0.19.0_linux-arm64.tar.gz
cd kubo
./install.sh
ipfs --version
cd ..
ipfs init --profile=lowpower
ipfs init
# ipfs daemon