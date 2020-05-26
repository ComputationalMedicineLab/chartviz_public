# Step 1: build the frontend client
FROM node:alpine as bundler
WORKDIR /code
COPY frontend/ .
RUN chmod +x build.sh
RUN ./build.sh

# Step 2: build the Django service
FROM python:alpine

# We need some of these libs to run pip install
RUN apk add --no-cache \
     --repository http://dl-cdn.alpinelinux.org/alpine/v3.6/main \
     --repository http://dl-cdn.alpinelinux.org/alpine/v3.6/community \
     build-base gfortran libpq openblas openblas-dev \
     postgresql-client postgresql-dev git

# Install the sciency libs
# Some of these are required to build later dependencies, some are just very
# long builds that we'd like to cache in their own layer
RUN pip install --upgrade pip setuptools wheel
RUN pip install --upgrade numpy
RUN pip install --upgrade scipy
RUN pip install --upgrade pandas
RUN pip install --upgrade cython
RUN pip install --upgrade gensim

RUN ln -s /usr/include/locale.h /usr/include/xlocale.h

RUN mkdir -p /code/backend /code/frontend
WORKDIR /code

# Copy over the Django source
COPY backend backend/

# Copy over the build React files where Django expects them
COPY --from=bundler /code/build frontend/build/

# Install prereqs
RUN pip install -r backend/requirements.txt

COPY wait-for-pg run-app /
RUN  chmod +x /wait-for-pg /run-app
ENTRYPOINT  ["/wait-for-pg"]
