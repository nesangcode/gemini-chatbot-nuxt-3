import { d as defineEventHandler, a as getUserFromSession } from '../../../_/nitro.mjs';
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

const me_get = defineEventHandler(async (event) => {
  try {
    const user = await getUserFromSession(event);
    if (!user) {
      return { user: null };
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        logtoId: user.logtoId
      }
    };
  } catch (error) {
    return { user: null };
  }
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
