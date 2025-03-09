ARG UPGRADE_PACKAGES="false"

FROM mcr.microsoft.com/devcontainers/javascript-node:1-18-bullseye

RUN export DEBIAN_FRONTEND=noninteractive \
  && apt-get update \
  && apt-get -y -q install --no-install-recommends \
    bat \
    dnsutils \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
  && mkdir -p /workspace \
  && chmod -R 777 /workspace \
  && chmod -R g+s /workspace \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENV ENVIRONMENT=development DOCKER_DEVCONTAINER=1
ENV DBUS_SESSION_BUS_ADDRESS=/dev/null

WORKDIR /workspace

EXPOSE 80

COPY . .
