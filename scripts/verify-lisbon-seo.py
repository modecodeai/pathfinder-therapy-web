"""Check generated public pages, structured data, assets and internal links."""
import json
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links, self.canonicals, self.metas, self.schemas = [], [], [], [], []
        self.h1, self.heads, self.ends = 0, 0, 0
        self.schema = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.h1 += tag == 'h1'
        self.heads += tag == 'head'
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag in ('a', 'link', 'img', 'script'):
            self.links.append(attrs.get('href', attrs.get('src', '')))
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonicals.append(attrs.get('href'))
        if tag == 'meta':
            self.metas.append((attrs.get('name', attrs.get('property')), attrs.get('content', '')))
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.schema = ''

    def handle_data(self, text):
        if self.schema is not None:
            self.schema += text

    def handle_endtag(self, tag):
        self.ends += tag == 'head'
        if tag == 'script' and self.schema is not None:
            self.schemas.append(json.loads(self.schema))
            self.schema = None


root = Path(sys.argv[1] if len(sys.argv) > 1 else 'out').resolve()
pages = {}
for file in root.rglob('index.html'):
    page = Page()
    page.feed(file.read_text())
    pages[file] = page
errors = []
for file, page in pages.items():
    route = '/' + file.relative_to(root).as_posix().removesuffix('index.html')
    def check(condition, message):
        if not condition:
            errors.append(f'{route}: {message}')
    check(page.h1 == 1, 'must have one H1')
    check(page.heads == page.ends == 1, 'must have one complete head')
    check(len(page.canonicals) == 1, 'must have one canonical')
    if page.canonicals:
        check(page.canonicals[0] == 'https://www.pathfindertherapy.com' + route, 'canonical must match this route')
    check(len(set(page.ids)) == len(page.ids), 'duplicate element IDs')
    for key in ('description', 'og:title', 'og:description', 'og:url', 'og:image', 'twitter:title', 'twitter:card'):
        check(sum(k == key for k, _ in page.metas) == 1, f'must have one {key}')
    for link in page.links:
        url = urlsplit(link)
        if url.scheme or url.netloc or not link or url.path.startswith('/api/'):
            continue
        target = root / url.path.lstrip('/') if url.path.startswith('/') else file.parent / url.path
        if target.is_dir():
            target /= 'index.html'
        if not url.path:
            target = file
        target = target.resolve()
        check(target.exists(), f'missing local target {link}')
        if url.fragment and target in pages:
            check(unquote(url.fragment) in pages[target].ids, f'missing anchor {link}')
    if route in ('/', '/psychotherapy-lisbon/', '/trauma-therapy-lisbon/', '/emdr-therapy-lisbon/', '/english-speaking-therapist-lisbon/'):
        check(not any(k == 'robots' and 'noindex' in v for k, v in page.metas), 'public landing must be indexable')
if errors:
    print('\n'.join(errors))
    sys.exit(1)
print(f'PASS: {len(pages)} pages — canonical URLs, unique headings and IDs, metadata, structured data, local links and anchors')
