FROM ipfs/go-ipfs:latest
FROM node:latest

WORKDIR /app

# COPY package*.json ./

# RUN npm install

COPY . .

EXPOSE 3000

CMD  ["ipfs", "add", "myfile.txt"]

