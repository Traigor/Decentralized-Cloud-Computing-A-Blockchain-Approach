FROM ipfs/go-ipfs:v0.10.0

COPY myfile.txt /app/myfile.txt

RUN ipfs init && \
    ipfs add /app/myfile.txt

CMD ["ipfs", "daemon"]
