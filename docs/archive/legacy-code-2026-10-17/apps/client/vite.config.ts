import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({ base: './', build: { rollupOptions: { input: { main:fileURLToPath(new URL('./index.html',import.meta.url)),character:fileURLToPath(new URL('./character.html',import.meta.url)),pixel:fileURLToPath(new URL('./pixel.html',import.meta.url)),scarletBase:fileURLToPath(new URL('./scarlet-base.html',import.meta.url)),scarletDirections:fileURLToPath(new URL('./scarlet-directions.html',import.meta.url)),scarletWalk:fileURLToPath(new URL('./scarlet-walk.html',import.meta.url)),scarletRig:fileURLToPath(new URL('./scarlet-rig.html',import.meta.url)),scarletFrames:fileURLToPath(new URL('./scarlet-frames.html',import.meta.url)) } } } });




