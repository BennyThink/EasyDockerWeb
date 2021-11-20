FROM ghcr.io/bennythink/base as mybase

FROM ubuntu:20.04
RUN apt update && apt install -y openssh-server  && mkdir /run/sshd
RUN echo 'root:root' |chpasswd && echo "PermitRootLogin yes" >> /etc/ssh/sshd_config

COPY --from=mybase /etc/supervisor.conf /etc
COPY --from=mybase /usr/local/bin/supervisord /usr/local/bin/supervisord

ENTRYPOINT  ["supervisord", "-c" ,"/etc/supervisor.conf"]