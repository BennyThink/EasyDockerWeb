import glob
import os

from fabric.api import local

registry = "ghcr.io/bennythink"


# fabric3
def base():
    local(f"docker build -f images/library/alpine/base/Dockerfile -t {registry}/alpine:base .")
    local(f"docker push {registry}/alpine:base ")


def build():
    base()
    for fn in glob.iglob("images/**/Dockerfile", recursive=True):
        dirs: "list" = fn.split(os.sep)
        username = dirs[1]
        distro = dirs[2]
        tag = dirs[3]
        image_tag = f"{username}/{distro}:{tag}"
        local(f"docker build -f {fn} --build-arg image_tag={image_tag} -t {registry}/{distro}:{tag} .")
        local(f"docker push {registry}/{distro}:{tag}")


def prepare():
    for fn in glob.iglob("images/**/Dockerfile", recursive=True):
        dirs: "list" = fn.split(os.sep)
        distro = dirs[2]
        tag = dirs[3]
        local(f"docker pull {registry}/{distro}:{tag}")
