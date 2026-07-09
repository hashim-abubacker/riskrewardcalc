import { config, fields, collection } from '@keystatic/core';

export default config({
  storage:
    process.env.NODE_ENV === 'production'
      ? {
          kind: 'github',
          repo: (process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO as `${string}/${string}`) || 'owner/repo',
        }
      : {
          kind: 'local',
        },
  collections: {
    blog: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({
          label: 'Date',
          defaultValue: { kind: 'today' },
        }),
        author: fields.text({ label: 'Author', defaultValue: 'RiskRewardCalc' }),
        description: fields.text({ label: 'Description', multiline: true }),
        content: fields.mdx({
          label: 'Content',
        }),
      },
    }),
  },
});
