import { defineDocumentType, makeSource } from 'contentlayer2/source-files';
import path from 'path';

export const Devlog = defineDocumentType(() => ({
  name: 'Devlog',
  filePathPattern: `devlog/*.mdx`,
  fields: {
    title: { type: 'string', required: true },
    summary: { type: 'string', required: true },
    date: { type: 'date', required: true },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (post) => toUrl(post._raw.sourceFilePath),
    },
  },
}));

const toUrl = (p: string) => {
  const parsedPath = path.parse(p);
  return path.join(parsedPath.dir, parsedPath.name);
};

export const Manual = defineDocumentType(() => ({
  name: 'Manual',
  filePathPattern: `manual/*.mdx`,
  fields: {
    title: { type: 'string', required: true },
    summary: { type: 'string', required: true },
    date: { type: 'date', required: true },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (post) => toUrl(post._raw.sourceFilePath),
    },
  },
}));

export const Page = defineDocumentType(() => ({
  name: 'Page',
  filePathPattern: `pages/*.mdx`,
  fields: {
    title: { type: 'string', required: true },
    summary: { type: 'string', required: true },
    date: { type: 'date', required: true },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (post) =>
        path.basename(
          post._raw.sourceFileName,
          path.extname(post._raw.sourceFileName)
        ),
    },
  },
}));

export default makeSource({
  contentDirPath: 'apps/site/content',
  documentTypes: [Devlog, Manual, Page],
});
