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
      baseUrl: 'http://localhost:5000',
      clean: true,
      formatter: 'prettier',
      mock: true,
      override: {
        operations: {
          listChannelMessages: {
            query: {
              useInfinite: true,
              useInfiniteQueryParam: 'page'
            }
          },
          listDirectChatMessages: {
            query: {
              useInfinite: true,
              useInfiniteQueryParam: 'page'
            }
          }
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
      target: '../../../app/src/api/endpoints',
      fileExtension: '.zod.ts',
      formatter: 'prettier',
    },
  },
});