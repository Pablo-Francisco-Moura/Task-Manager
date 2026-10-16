FROM node:20-alpine

WORKDIR /app

ARG LOCAL_UID=1000
ARG LOCAL_GID=1000

COPY package.json package-lock.json ./

RUN npm ci

COPY prisma ./prisma

RUN npx prisma generate

RUN mkdir -p /app/.next /home/app \
	&& chown -R ${LOCAL_UID}:${LOCAL_GID} /app/node_modules /app/.next /home/app

COPY . .

RUN chown ${LOCAL_UID}:${LOCAL_GID} /app/next-env.d.ts

ENV HOME=/home/app

USER ${LOCAL_UID}:${LOCAL_GID}

EXPOSE 3000

CMD ["npm", "run", "dev:docker"]
