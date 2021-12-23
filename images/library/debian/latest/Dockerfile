ARG image_tag

FROM ghcr.io/bennythink/alpine:base as mybase

FROM ${image_tag}
RUN apt update && apt install -y --no-install-recommends openssh-server   && mkdir /run/sshd
RUN echo 'root:root' |chpasswd && echo "PermitRootLogin yes" >> /etc/ssh/sshd_config

COPY --from=mybase /etc/supervisor.conf /etc
COPY --from=mybase /usr/local/bin/supervisord /usr/local/bin/supervisord
COPY random /tmp/random

ENTRYPOINT  ["supervisord", "-c" ,"/etc/supervisor.conf"]
