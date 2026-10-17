# Legacy multiplayer server only. The current 3D client uses static hosting.
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm ci
COPY packages ./packages
COPY apps/server ./apps/server
RUN npm run build -w apps/server && npm prune --omit=dev

FROM node:24-bookworm-slim
ENV NODE_ENV=production
ENV PORT=2567
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/server ./apps/server
USER node
EXPOSE 2567
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "apps/server/dist/apps/server/src/index.js"]
