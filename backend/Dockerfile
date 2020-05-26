# Development image

FROM python:alpine

# We need some of these libs to run pip install
RUN apk add --no-cache \
     --repository http://dl-cdn.alpinelinux.org/alpine/v3.6/main \
     --repository http://dl-cdn.alpinelinux.org/alpine/v3.6/community \
     build-base gfortran libpq openblas openblas-dev \
     postgresql-client postgresql-dev git

# Install the sciency libs
RUN pip install --upgrade numpy
RUN pip install --upgrade scipy
RUN pip install --upgrade pandas
RUN pip install --upgrade cython
RUN pip install --upgrade gensim

RUN ln -s /usr/include/locale.h /usr/include/xlocale.h

WORKDIR /code/backend
COPY backend/requirements.txt .
RUN  pip install --upgrade pip setuptools wheel \
  && pip install -r requirements.txt

COPY wait-for-pg /
RUN  chmod +x /wait-for-pg
ENTRYPOINT  ["/wait-for-pg"]

# vim: ft=Dockerfile
