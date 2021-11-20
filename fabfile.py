import glob
import os

from fabric.api import local

registry = "ghcr.io/bennythink"


# fabric3
def base():
    local(f"docker build -f images/base/Dockerfile -t {registry}/base .")


def ubuntu(version="20.04"):
    local(f"docker build -f images/ubuntu/{version}/Dockerfile -t {registry}/ubuntu:{version} .")


def all():
    for filename in glob.iglob("images/**/Dockerfile", recursive=True):
        each: "list" = filename.split(os.sep)
        if len(each) == 4:
            version = each[-2]
        else:
            version = "latest"
        local(f"docker build -f {filename} -t {registry}/{each[1]}:{version} .")


def push():
    for filename in glob.iglob("images/**/Dockerfile", recursive=True):
        each: "list" = filename.split(os.sep)
        if len(each) == 4:
            version = each[-2]
        else:
            version = "latest"
        local(f"docker push  {registry}/{each[1]}:{version} ")


def start():
    base()
    all()
    push()


def run(image=f"{registry}/ubuntu:20.04", port=2222, rm=True):
    if rm:
        cmd = f"docker run --rm -p {port}:22 {image}"
    else:
        cmd = f"docker run  -p {port}:22 {image}"
    local(cmd)
