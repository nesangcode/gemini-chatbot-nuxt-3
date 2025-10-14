import { e as defineNuxtRouteMiddleware, n as navigateTo } from './server.mjs';
import 'vue';
import '../_/nitro.mjs';
import 'unified';
import 'remark-parse';
import 'remark-rehype';
import 'remark-mdc';
import 'remark-gfm';
import 'rehype-external-links';
import 'rehype-sort-attribute-values';
import 'rehype-sort-attributes';
import 'rehype-raw';
import 'detab';
import 'micromark-util-sanitize-uri';
import 'hast-util-to-string';
import 'github-slugger';
import 'node:module';
import '@ai-sdk/google';
import 'ai';
import '@prisma/client';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import '@logto/node';
import '@silverhand/essentials';
import 'node:url';
import 'ipx';
import 'node:fs';
import 'node:path';
import 'vue-router';
import 'tailwind-merge';
import '@iconify/vue';
import 'markdown-it';
import 'vue/server-renderer';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

const auth = defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = ["/", "/sign-in", "/callback", "/callback/continue"];
  if (publicPaths.some((p) => to.path.startsWith(p))) return;
  {
    return navigateTo("/login", { redirectCode: 302 });
  }
});

export { auth as default };
//# sourceMappingURL=auth-C1q9QhZw.mjs.map
