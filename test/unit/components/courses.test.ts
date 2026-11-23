import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { cmsCourses } from '../../../src/utils/courses';
import { fetchCmsBuildContent } from '../../../src/utils/payload-build';
import type { CmsBuildContent } from '../../../src/utils/payload-build';
import CourseTeaser from '../../../src/components/CourseTeaser.astro';

const course = (extra = {}) => ({
  id: 3,
  publicOnWebsite: true,
  slug: 'demo-kurs',
  title: 'Demo <Kurs>',
  description: 'Synthetischer Kurs',
  modules: [
    { title: 'Eins', duration: 10, objectives: ['Ziel A', 'Ziel B'] },
    { title: 'Zwei', duration: 15, objectives: ['Ziel C'] },
  ],
  ...extra,
});
const content = (courses: unknown[]): CmsBuildContent => ({
  enabled: true,
  pages: [],
  posts: [],
  authors: [],
  media: {},
  site: { courses: courses as CmsBuildContent['site'][string] },
});

describe('public course teasers', () => {
  it('requests courses only after explicit opt-in and only flagged ones', async () => {
    const requested: URL[] = [];
    const fetcher = (async (input) => {
      requested.push(new URL(String(input)));
      return Response.json({ docs: [], page: 1, totalPages: 0, totalDocs: 0 });
    }) as typeof fetch;
    const options = {
      url: 'https://cms.example.invalid',
      apiKey: 'synthetic-only',
      fetcher,
      mediaDirectory: '/tmp/kieks-courses-unit-empty',
    };
    await fetchCmsBuildContent(options);
    expect(requested.some((url) => url.pathname === '/api/courses')).toBe(false);
    await fetchCmsBuildContent({ ...options, courses: true });
    const request = requested.find((url) => url.pathname === '/api/courses')!;
    expect(request.searchParams.get('where[publicOnWebsite][equals]')).toBe('true');
    expect(request.searchParams.get('where[_status][equals]')).toBeNull();
    expect(request.searchParams.get('select[modules]')).toBe('true');
    expect(request.searchParams.get('depth')).toBe('0');
    expect(request.searchParams.has('select[questions]')).toBe(false);
    expect(requested.some((url) => url.pathname === '/api/course-questions')).toBe(false);
  });

  it('never lets course text, answers or foreign fields into the build snapshot', async () => {
    const fetcher = (async (input) => {
      const url = new URL(String(input));
      if (url.pathname !== '/api/courses') return Response.json({ docs: [], page: 1, totalPages: 0, totalDocs: 0 });
      return Response.json({
        docs: [
          course({
            modules: [
              { title: 'Eins', duration: 10, objectives: ['Ziel'], content: { root: 'PRIVATE TEXT' }, id: 'x' },
            ],
            correctAnswer: 'B',
            createdBy: { relationTo: 'users', value: 1 },
          }),
        ],
        page: 1,
        totalPages: 1,
        totalDocs: 1,
      });
    }) as typeof fetch;
    const result = await fetchCmsBuildContent({
      url: 'https://cms.example.invalid',
      apiKey: 'synthetic-only',
      fetcher,
      courses: true,
      mediaDirectory: '/tmp/kieks-courses-unit-empty',
    });
    const json = JSON.stringify(result);
    expect(json).not.toContain('PRIVATE TEXT');
    expect(json).not.toContain('correctAnswer');
    expect(json).not.toContain('createdBy');
    expect(result.site.courses[0].modules).toEqual([{ title: 'Eins', duration: 10, objectives: ['Ziel'] }]);
  });

  it('rejects courses without website release and keeps CMS failures visible', async () => {
    const base = {
      url: 'https://cms.example.invalid',
      apiKey: 'synthetic-only',
      courses: true,
      mediaDirectory: '/tmp/kieks-courses-unit-empty',
    };
    await expect(
      fetchCmsBuildContent({
        ...base,
        fetcher: (async (input) =>
          new URL(String(input)).pathname === '/api/courses'
            ? Response.json({ docs: [course({ publicOnWebsite: false })], page: 1, totalPages: 1, totalDocs: 1 })
            : Response.json({ docs: [], page: 1, totalPages: 0, totalDocs: 0 })) as typeof fetch,
      })
    ).rejects.toThrow('Unpublished CMS courses rejected');
    await expect(
      fetchCmsBuildContent({ ...base, fetcher: (async () => new Response('', { status: 403 })) as typeof fetch })
    ).rejects.toThrow('CMS build request failed');
  });

  it('maps teaser data, validates it and renders escaped markup', async () => {
    const [mapped] = cmsCourses(content([course()]));
    expect(mapped.totalMinutes).toBe(25);
    expect(mapped.url).toBe('/kurse/demo-kurs');
    expect(mapped.courseUrl).toBe('https://kurse.kieks.me/demo-kurs/');
    expect(() => cmsCourses(content([course({ publicOnWebsite: false })]))).toThrow('release');
    expect(() => cmsCourses(content([course({ slug: '../evil' })]))).toThrow('slug');
    expect(() => cmsCourses(content([course(), course({ id: 4 })]))).toThrow('Duplicate');
    expect(() => cmsCourses(content([course({ modules: [{ title: 'x', duration: 0 }] })]))).toThrow('module');
    expect(cmsCourses({ ...content([]), site: {} })).toEqual([]);
    const html = await (await AstroContainer.create()).renderToString(CourseTeaser, { props: { course: mapped } });
    expect(html).toContain('Demo &lt;Kurs&gt;');
    expect(html).toContain('2 Module · ca. 25 Minuten');
    expect(html).not.toContain('<Kurs>');
  });
});
