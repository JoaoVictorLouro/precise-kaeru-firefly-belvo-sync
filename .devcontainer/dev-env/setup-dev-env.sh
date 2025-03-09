#!/bin/bash
set -e

RED_COLOR='\033[0;31m'
GREEN_COLOR='\033[0;32m'
NO_COLOR='\033[0m'

export $(cat .env | sed 's/#.*//g' | xargs)

echo -e "${GREEN_COLOR}# Installing bun...${NO_COLOR}"
curl -fsSL https://bun.sh/install | bash;

echo -e "${GREEN_COLOR}# Installing project node dependencies...${NO_COLOR}"
yarn install --frozen-lockfile;

echo -e "${GREEN_COLOR}# Done!"

echo
