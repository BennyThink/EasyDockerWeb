FROM alpine

RUN wget https://github.com/ochinchina/supervisord/releases/download/v0.7.3/supervisord_0.7.3_Linux_64-bit.tar.gz &&\
    tar -xzf supervisord_0.7.3_Linux_64-bit.tar.gz &&ls &&\
    mv supervisord_0.7.3_Linux_64-bit/supervisord /usr/local/bin/supervisord &&\
    rm -rf supervisord_0.7.3_Linux_64-bit.tar.gz

COPY images/library/alpine/base/supervisor.conf /etc/

