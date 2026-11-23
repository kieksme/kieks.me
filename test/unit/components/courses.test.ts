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

describe('english course teasers', () => {
  const en = (courses: unknown[]): CmsBuildContent => ({ ...content(courses), locale: 'en' });
  const english = (extra = {}) =>
    course({
      title: 'Demo <Course>',
      description: 'Synthetic course',
      pathSlug: 'demo-course',
      modules: [{ title: 'One', duration: 10, objectives: ['Goal A'] }],
      ...extra,
    });

  it('maps to the English URL while linking the shared course platform path', () => {
    const [mapped] = cmsCourses(en([english()]));
    expect(mapped.locale).toBe('en');
    expect(mapped.slug).toBe('demo-course');
    expect(mapped.url).toBe('/en/courses/demo-course');
    expect(mapped.courseUrl).toBe('https://kurse.kieks.me/demo-kurs/');
  });

  it('omits courses without a complete English version instead of falling back to German or failing the build', () => {
    expect(cmsCourses(en([english({ pathSlug: '' })]))).toEqual([]);
    expect(cmsCourses(en([english({ pathSlug: undefined })]))).toEqual([]);
    expect(cmsCourses(en([english({ title: '' })]))).toEqual([]);
    expect(cmsCourses(en([english({ modules: [{ title: '', duration: 10 }] })]))).toEqual([]);
    expect(() => cmsCourses(content([course({ modules: [{ title: '', duration: 10 }] })]))).toThrow('module');
    expect(() => cmsCourses(en([english({ pathSlug: '../evil' })]))).toThrow('slug');
    expect(() => cmsCourses(en([english({ publicOnWebsite: false })]))).toThrow('release');
  });

  it('requests the English locale without fallback and the URL name', async () => {
    const requested: URL[] = [];
    await fetchCmsBuildContent({
      url: 'https://cms.example.invalid',
      apiKey: 'synthetic-only',
      courses: true,
      locale: 'en',
      mediaDirectory: '/tmp/kieks-courses-unit-empty',
      fetcher: (async (input) => {
        requested.push(new URL(String(input)));
        return Response.json({ docs: [], page: 1, totalPages: 0, totalDocs: 0 });
      }) as typeof fetch,
    });
    const request = requested.find((url) => url.pathname === '/api/courses')!;
    expect(request.searchParams.get('locale')).toBe('en');
    expect(request.searchParams.get('fallback-locale')).toBe('none');
    expect(request.searchParams.get('select[pathSlug]')).toBe('true');
  });

  it('renders the English teaser with escaped markup', async () => {
    const [mapped] = cmsCourses(en([english()]));
    const html = await (await AstroContainer.create()).renderToString(CourseTeaser, { props: { course: mapped } });
    expect(html).toContain('Demo &lt;Course&gt;');
    expect(html).toContain('1 module · approx. 10 minutes');
    expect(html).toContain('href="/en/courses/demo-course"');
    expect(html).toContain('View course');
  });
});
