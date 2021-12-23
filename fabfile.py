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
        with open("random", "w") as f:
            f.write(image_tag)
        local(f"docker build -f {fn} --build-arg image_tag={image_tag} -t {registry}/{distro}:{tag} .")
        local(f"docker push {registry}/{distro}:{tag}")
    os.remove("random")


def prepare():
    for fn in glob.iglob("images/**/Dockerfile", recursive=True):
        dirs: "list" = fn.split(os.sep)
        distro = dirs[2]
        tag = dirs[3]
        local(f"docker pull {registry}/{distro}:{tag}")
