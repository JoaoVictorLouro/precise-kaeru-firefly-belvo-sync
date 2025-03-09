# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 as base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM node:20-slim AS install
RUN mkdir -p /temp/dev
COPY package.json yarn.lock /temp/dev/
RUN cd /temp/dev && yarn install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json yarn.lock /temp/prod/
RUN cd /temp/prod && yarn install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY . .
COPY --from=install /temp/dev/node_modules node_modules

# # [optional] tests & build
# ENV NODE_ENV=production
# RUN bun test
# RUN ls -a node_modules && bun run build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/src/ src
COPY --from=prerelease /usr/src/app/public/ public
COPY --from=prerelease /usr/src/app/package.json .
RUN mkdir -p ./log /log /config && chown -R bun:bun ./log /log /config

USER bun

# run the app
EXPOSE 5000/tcp
ENTRYPOINT [ "bun", "run", "./src/index.ts" ]
