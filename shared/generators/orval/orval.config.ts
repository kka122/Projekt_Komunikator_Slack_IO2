import {defineConfig} from 'orval';

export default defineConfig({
  szponcik: {
    output: {
      client: 'zod',
      mode: 'tags-split',
      target: '../../../app/src/schemas',
    },
    input: {
      target: '../../openapi/openapi.yaml',
    },
  },
});