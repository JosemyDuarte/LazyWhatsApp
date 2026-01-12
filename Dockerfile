FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=npm,target=/root/.npm npm install
RUN npm run build

FROM base AS runtime
COPY --from=build /usr/src/app/dist /usr/src/app/dist
WORKDIR /usr/src/app
EXPOSE 4321
CMD ["npm", "run", "preview"]
