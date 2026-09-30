#!/usr/bin/env python3
"""Generate the Publications list from publications.bib.

Standard-library only so it runs in GitHub Actions without extra dependencies.
The BibTeX file is the single source of truth for publication entries, tags and links.
"""
from __future__ import annotations

from pathlib import Path
import html
import re

ROOT = Path(__file__).resolve().parents[1]
BIB = ROOT / "publications.bib"
OUT = ROOT / "generated" / "publications-list.html"


def strip_outer(value: str) -> str:
    value = value.strip().rstrip(',').strip()
    if len(value) >= 2 and value[0] == '{' and value[-1] == '}':
        value = value[1:-1]
    elif len(value) >= 2 and value[0] == '"' and value[-1] == '"':
        value = value[1:-1]
    return value.strip()


def parse_fields(body: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    i, n = 0, len(body)
    while i < n:
        while i < n and (body[i].isspace() or body[i] == ','):
            i += 1
        m = re.match(r'([A-Za-z_][\w-]*)\s*=\s*', body[i:])
        if not m:
            i += 1
            continue
        key = m.group(1).lower()
        i += m.end()
        if i >= n:
            break
        if body[i] == '{':
            start = i
            depth = 0
            while i < n:
                if body[i] == '{': depth += 1
                elif body[i] == '}':
                    depth -= 1
                    if depth == 0:
                        i += 1
                        break
                i += 1
            value = body[start:i]
        elif body[i] == '"':
            start = i
            i += 1
            while i < n:
                if body[i] == '"' and body[i-1] != '\\':
                    i += 1
                    break
                i += 1
            value = body[start:i]
        else:
            start = i
            while i < n and body[i] not in ',\n': i += 1
            value = body[start:i]
        fields[key] = strip_outer(value).replace('--', '–')
    return fields


def parse_bib(text: str) -> list[dict[str, str]]:
    entries = []
    i = 0
    while True:
        at = text.find('@', i)
        if at < 0: break
        m = re.match(r'@(\w+)\s*\{\s*([^,]+),', text[at:])
        if not m:
            i = at + 1
            continue
        entry_type, key = m.group(1).lower(), m.group(2).strip()
        body_start = at + m.end()
        depth = 1
        j = body_start
        while j < len(text) and depth:
            if text[j] == '{': depth += 1
            elif text[j] == '}': depth -= 1
            j += 1
        body = text[body_start:j-1]
        entry = {'ENTRYTYPE': entry_type, 'ID': key}
        entry.update(parse_fields(body))
        entries.append(entry)
        i = j
    return entries


def clean(value: str) -> str:
    return value.replace('{', '').replace('}', '').strip()


def initials(given: str) -> str:
    # Preserve already-initialled names and hyphenated initials cleanly.
    parts = re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]+(?:-[A-Za-zÀ-ÖØ-öø-ÿ]+)?", given)
    out = []
    for part in parts:
        if '-' in part:
            out.append('-'.join(p[0] + '.' for p in part.split('-') if p))
        else:
            out.append(part[0] + '.')
    return ' '.join(out)


def format_authors(raw: str) -> str:
    people = [p.strip() for p in raw.split(' and ') if p.strip()]
    names = []
    for p in people:
        if p.lower() == 'others':
            names.append('et al.')
        elif ',' in p:
            last, given = [x.strip() for x in p.split(',', 1)]
            names.append(f"{clean(last)}, {initials(clean(given))}")
        else:
            bits = p.split()
            names.append(f"{clean(bits[-1])}, {initials(' '.join(bits[:-1]))}")
    if not names: return ''
    if names[-1] == 'et al.':
        return ', '.join(names[:-1]) + (', et al.' if len(names) > 1 else 'et al.')
    if len(names) == 1: return names[0]
    if len(names) == 2: return ' & '.join(names)
    return ', '.join(names[:-1]) + ', & ' + names[-1]


def esc(value: str) -> str:
    return html.escape(clean(value), quote=True)


def venue(e: dict[str, str]) -> str:
    typ = e['ENTRYTYPE']
    if e.get('journal'):
        v = f"<em>{esc(e['journal'])}</em>"
        if e.get('volume'): v += f", {esc(e['volume'])}"
        if e.get('number'): v += f"({esc(e['number'])})"
        if e.get('pages'): v += f", {esc(e['pages'])}"
        return v + '.'
    if e.get('booktitle'):
        v = f"<em>{esc(e['booktitle'])}</em>"
        if e.get('volume'): v += f", {esc(e['volume'])}"
        if e.get('number') and not e.get('volume'): v += f", {esc(e['number'])}"
        if e.get('pages'): v += f", {esc(e['pages'])}"
        if e.get('publisher'): v += f". {esc(e['publisher'])}"
        return v + '.'
    if typ == 'book':
        bits = []
        if e.get('series'):
            x = esc(e['series'])
            if e.get('volume'): x += ' ' + esc(e['volume'])
            bits.append(x)
        if e.get('publisher'): bits.append(esc(e['publisher']))
        return '. '.join(bits) + ('.' if bits else '')
    if typ == 'phdthesis':
        return f"Doctoral dissertation, {esc(e.get('school',''))}."
    if e.get('howpublished'):
        return esc(e['howpublished']) + '.'
    if e.get('institution'):
        v = esc(e['institution'])
        if e.get('number'): v += ', ' + esc(e['number'])
        return v + '.'
    if e.get('note'):
        return esc(e['note']) + '.'
    return ''


def link_label(e: dict[str, str]) -> str:
    if e.get('url_label'): return clean(e['url_label'])
    url = e.get('url', '')
    if 'ora.ox.ac.uk' in url or 'escholarship.org' in url: return 'Open access'
    return 'Paper'


def main() -> None:
    entries = parse_bib(BIB.read_text(encoding='utf-8'))
    entries.sort(key=lambda e: (int(e.get('year', '0') or 0), clean(e.get('title','')).casefold()), reverse=True)

    lines = [
        '<!-- Generated by scripts/generate_publications.py from publications.bib. Do not edit this file directly. -->',
        '<section class="section publications-section">',
        '<div id="pub-filter-controls" class="filter-bar" aria-label="Filter publications"></div>',
        '',
        '<div class="pub-list" id="pub-list">'
    ]
    last_year = None
    for e in entries:
        year = clean(e.get('year', ''))
        if year != last_year:
            lines.append(f'<h2 class="pub-year">{esc(year)}</h2>')
            last_year = year
        tags = ' '.join(x.strip() for x in e.get('keywords','').split(',') if x.strip())
        lines += [
            f'<article class="pub" data-tags="{html.escape(tags, quote=True)}">',
            f'<div class="pub-title">{esc(e.get("title", ""))}</div>',
            f'<div class="pub-authors">{html.escape(format_authors(e.get("author", "")))} ({esc(year)}).</div>',
            f'<div class="pub-venue">{venue(e)}</div>'
        ]
        links = []
        if e.get('doi'):
            doi = clean(e['doi'])
            links.append(f'<a href="https://doi.org/{html.escape(doi, quote=True)}">DOI</a>')
        if e.get('url'):
            links.append(f'<a href="{html.escape(clean(e["url"]), quote=True)}">{html.escape(link_label(e))}</a>')
        if links:
            lines.append('<div class="pub-links">' + ' '.join(links) + '</div>')
        lines += ['</article>', '']
    lines += ['</div>', '</section>']
    OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'Generated {OUT.relative_to(ROOT)} from {len(entries)} BibTeX entries.')

if __name__ == '__main__':
    main()
