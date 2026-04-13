// @ts-ignore
import { defineConfig } from 'orval';

export default defineConfig({
  szponcik: {
    input: '../../openapi/openapi.yaml',
    output: {
      mode: 'tags-split',
      target: '../../../app/schemas/endpoints',
      schemas: '../../../app/schemas/models',
      client: 'react-query',
      mock: true,
      override: {
        query: {
          useQuery: true,
          useInfinite: true,
        }
      }
    },
  },
  szponcikZod: {
    input: {
      target: '../../openapi/openapi.yaml',
    },
    output: {
      mode: 'tags-split',
      client: 'zod',
      target: '../../../app/schemas/endpoints',
      fileExtension: '.zod.ts',
    },
  }
});