FROM python:3

#argument can be deleted as the seed (verification_function) will be given inside maker by the smart contract
ARG seed=\Hello\ World
ENV seed=$seed

# set a directory for the app
WORKDIR /usr/src/app

# copy all the files to the container
COPY . .

# install dependencies
RUN pip install --no-cache-dir -r requirements.txt &&\
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir psutil &&\
    touch script.py &&\
    chmod -R 777 *.sh

# define the port number the container should expose
EXPOSE 5000

# run the command
CMD ./script2.sh
