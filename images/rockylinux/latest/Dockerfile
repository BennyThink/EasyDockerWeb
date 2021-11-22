ARG version=latest

FROM ghcr.io/bennythink/base as mybase

FROM rockylinux/rockylinux:${version}
RUN yum install -y openssh-server  && /usr/bin/ssh-keygen -A
RUN echo 'root:root' |chpasswd && echo "PermitRootLogin yes" >> /etc/ssh/sshd_config

COPY --from=mybase /etc/supervisor.conf /etc
COPY --from=mybase /usr/local/bin/supervisord /usr/local/bin/supervisord

ENTRYPOINT  ["supervisord", "-c" ,"/etc/supervisor.conf"]