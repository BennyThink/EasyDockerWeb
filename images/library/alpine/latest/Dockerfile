ARG image_tag

FROM ghcr.io/bennythink/alpine:base as mybase

FROM ${image_tag}
RUN apk update && apk add dropbear
RUN mkdir /etc/dropbear && echo 'root:root' |chpasswd

RUN echo -e "[program:dropbear]\ncommand = /usr/sbin/dropbear -RFE" > /etc/supervisor.conf
COPY --from=mybase /usr/local/bin/supervisord /usr/local/bin/supervisord

ENTRYPOINT  ["supervisord", "-c" ,"/etc/supervisor.conf"]