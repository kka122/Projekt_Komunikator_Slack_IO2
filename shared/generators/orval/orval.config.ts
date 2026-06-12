import {defineConfig} from 'orval';

export default defineConfig({
  szponcik: {
    input: {
      target: '../../openapi/openapi.yaml',
    },
    output: {
      mode: 'tags-split',
      client: 'react-query',
      target: '../../../app/src/api/endpoints',
      schemas: '../../../app/src/api/models',
      httpClient: 'axios',
      clean: true,
      formatter: 'prettier',
      mock: true,
    },
  },
  szponcikZod: {
    input: {
      target: '../../openapi/openapi.yaml',
    },
    output: {
      mode: 'tags-split',
      client: 'zod',
      target: '../../../app/src/api/endpoints',
      fileExtension: '.zod.ts',
      formatter: 'prettier',
    },
  },
});