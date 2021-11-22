import glob
import os

from fabric.api import local

registry = "ghcr.io/bennythink"


# fabric3
def base():
    local(f"docker build -f images/base/Dockerfile -t {registry}/base .")
    local(f"docker push {registry}/base ")


def all():
    for filename in glob.iglob("images/**/Dockerfile", recursive=True):
        dirs: "list" = filename.split(os.sep)
        if "base" not in dirs:
            version = dirs[-2]
            distro = dirs[-3]
            local(f"docker build -f {filename} --build-arg version={version} -t {registry}/{distro}:{version} .")
            local(f"docker push {registry}/{distro}:{version}")


def start():
    base()
    all()