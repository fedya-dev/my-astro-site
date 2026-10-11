import config from '../../site.config.json';

export const siteConfig = config;
export type Locale = 'bg' | 'en';
export const locales: Locale[] = ['bg', 'en'];

export const ui = {
  bg: {
    home: 'Начало', blog: 'Статии', about: 'За мен',
    readMore: 'Прочети статията', latest: 'Последни публикации',
    allPosts: 'Всички статии', search: 'Търсене',
    searchPlaceholder: 'Търси статии…', noResults: 'Няма намерени резултати.',
    back: 'Обратно към статиите', minRead: 'мин. четене', theme: 'Смяна на темата',
    language: 'Език', notFound: 'Страницата не е намерена',
    notFoundText: 'Възможно е адресът да е променен или страницата да не съществува.',
  },
  en: {
    home: 'Home', blog: 'Blog', about: 'About',
    readMore: 'Read article', latest: 'Latest articles',
    allPosts: 'All articles', search: 'Search',
    searchPlaceholder: 'Search articles…', noResults: 'No results found.',
    back: 'Back to articles', minRead: 'min read', theme: 'Toggle theme',
    language: 'Language', notFound: 'Page not found',
    notFoundText: 'The address may have changed or the page may no longer exist.',
  },
} as const;

export function localPath(lang: Locale, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const prefix = lang === 'en' ? '/en' : '';
  return `${prefix}/${clean ? `${clean}/` : ''}`;
}

export function dateLabel(date: Date, lang: Locale): string {
  return new Intl.DateTimeFormat(lang === 'bg' ? 'bg-BG' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
}

/** Convert Bulgarian, English and common Cyrillic labels into stable URL slugs. */
const transliteration: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht',
  ъ: 'a', ь: 'y', ю: 'yu', я: 'ya', ё: 'yo', ы: 'y', э: 'e', ї: 'yi', є: 'ye', ґ: 'g',
};

export function slugify(value: string): string {
  const transliterated = Array.from(value.toLowerCase(), (char) => transliteration[char] ?? char).join('');
  return transliterated
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
