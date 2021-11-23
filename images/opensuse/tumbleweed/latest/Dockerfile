ARG image_tag

FROM ghcr.io/bennythink/alpine:base as mybase

FROM ${image_tag}

RUN zypper install -y openssh-server  && /usr/bin/ssh-keygen -A
RUN echo 'root:root' |chpasswd && echo "PermitRootLogin yes" >> /etc/ssh/sshd_config

COPY --from=mybase /etc/supervisor.conf /etc
COPY --from=mybase /usr/local/bin/supervisord /usr/local/bin/supervisord

ENTRYPOINT  ["supervisord", "-c" ,"/etc/supervisor.conf"]