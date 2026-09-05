import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { transform } from "lightningcss";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex").slice(0, 12);
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1];
const setAttr = (tag, name, value) => {
  const pattern = new RegExp(`\\s${name}=["'][^"']*["']`, "i");
  return pattern.test(tag) ? tag.replace(pattern, ` ${name}="${value}"`) : tag.replace(/\s*\/?>$/, ` ${name}="${value}">`);
};

async function filesBelow(root) {
  const files = [];
  for (const item of await readdir(root, { withFileTypes: true })) {
    const full = path.join(root, item.name);
    if (item.isDirectory()) files.push(...await filesBelow(full));
    else files.push(full);
  }
  return files;
}

// Optimise the generated release; retain original assets and all CSS selectors.
export async function optimiseStaticSite(root, { cic = false } = {}) {
  root = path.resolve(root);
  const files = await filesBelow(root);
  const documents = files.filter((file) => /\.(?:html|css)$/.test(file));
  const contents = new Map(await Promise.all(documents.map(async (file) => [file, await readFile(file, "utf8")])));
  const imageFiles = new Set();
  const resolveLocal = (url, source) => {
    if (!url || /^(?:[a-z]+:|\/\/|#)/i.test(url)) return null;
    const clean = url.split(/[?#]/)[0];
    const full = path.resolve(url.startsWith("/") ? root : path.dirname(source), `.${url.startsWith("/") ? clean : `/${clean}`}`);
    return full.startsWith(`${root}${path.sep}`) ? full : null;
  };
  for (const [file, source] of contents) {
    for (const match of source.matchAll(/(?:src|href)=["']([^"']+)["']|url\(["']?([^)'"\s]+)["']?\)/gi)) {
      const full = resolveLocal(match[1] ?? match[2], file);
      if (full && /\.(jpe?g|png|webp)$/i.test(full)) imageFiles.add(full);
    }
  }
  const output = path.join(root, "assets", "optimized");
  await mkdir(output, { recursive: true });
  const images = new Map();
  const report = { images: [], css: [], htmlPages: 0 };
  for (const file of imageFiles) {
    let bytes;
    try { bytes = await readFile(file); } catch { continue; }
    const metadata = await sharp(bytes).metadata();
    if (bytes.length < 50_000 || (metadata.width ?? 0) < 600 || metadata.pages > 1) continue;
    const variants = [];
    for (const width of [...new Set([480, 960, Math.min(1600, metadata.width)].filter((w) => w <= metadata.width))].sort((a, b) => a - b)) {
      const result = await sharp(bytes).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toBuffer({ resolveWithObject: true });
      const url = `/assets/optimized/${path.basename(file, path.extname(file))}-${hash(result.data)}.webp`;
      variants.push({ url, bytes: result.data.length, width: result.info.width, height: result.info.height, data: result.data });
    }
    let largest = variants.at(-1);
    if (!largest) continue;
    if (largest.bytes >= bytes.length * 0.95) {
      // Already well-compressed originals still benefit from phone-sized copies.
      variants.pop();
      largest = { url: `/${path.relative(root, file).split(path.sep).join("/")}`, bytes: bytes.length, width: metadata.width, height: metadata.height, data: bytes };
      variants.push(largest);
    }
    for (const variant of variants) await writeFile(path.join(root, variant.url), variant.data);
    const small = variants.find((v) => v.width >= 960) ?? largest;
    const variable = `--pf-image-${hash(Buffer.from(path.relative(root, file)))}`;
    images.set(file, { variants, largest, small, variable });
    report.images.push({ source: path.relative(root, file), before: bytes.length, after: largest.bytes, mobile: small.bytes });
  }
  const fontLinks = new Set();
  const replaceCss = (css, file) => css.replace(/@import\s+url\(['"]?(https:\/\/fonts\.googleapis\.com[^)'"\s]+)['"]?\);?/g, (_, url) => {
    fontLinks.add(url); return "";
  }).replace(/url\((['"]?)([^)'"\s]+)\1\)/g, (whole, quote, url) => {
    const full = resolveLocal(url, file);
    const item = images.get(full);
    if (item) return `var(${item.variable})`;
    return full ? `url("/${path.relative(root, full).split(path.sep).join("/")}${url.match(/[?#].*$/)?.[0] ?? ""}")` : whole;
  });
  const styles = new Map();
  for (const [file, source] of contents) {
    if (!file.endsWith(".css")) continue;
    const css = transform({ filename: file, code: Buffer.from(replaceCss(source, file)), minify: true }).code;
    const url = `/assets/optimized/styles-${hash(css)}.css`;
    await writeFile(path.join(root, url), css);
    styles.set(file, url);
    report.css.push({ source: path.relative(root, file), before: Buffer.byteLength(source), after: css.length });
  }
  const variables = `<style id="pathfinder-responsive-images">:root{${[...images.values()].map((i) => `${i.variable}:url("${i.largest.url}")`).join(";")}}@media(max-width:700px){:root{${[...images.values()].map((i) => `${i.variable}:url("${i.small.url}")`).join(";")}}}</style>`;
  for (const [file, source] of contents) {
    if (!file.endsWith(".html")) continue;
    let firstPhoto = true;
    let html = source.replace(/<img\b[^>]*>/gi, (tag) => {
      const item = images.get(resolveLocal(attr(tag, "src"), file));
      if (!item) return tag;
      tag = setAttr(tag, "src", item.largest.url);
      tag = setAttr(tag, "srcset", item.variants.map((v) => `${v.url} ${v.width}w`).join(", "));
      if (!attr(tag, "sizes")) tag = setAttr(tag, "sizes", "(max-width: 700px) 100vw, 960px");
      if (!attr(tag, "width") && !attr(tag, "height")) {
        tag = setAttr(setAttr(tag, "width", item.largest.width), "height", item.largest.height);
      }
      if (!firstPhoto && !attr(tag, "loading") && attr(tag, "fetchpriority") !== "high") tag = setAttr(tag, "loading", "lazy");
      firstPhoto = false;
      if (!attr(tag, "decoding")) tag = setAttr(tag, "decoding", "async");
      return tag;
    }).replace(/<link\b[^>]*>/gi, (tag) => {
      const full = resolveLocal(attr(tag, "href"), file);
      if (styles.has(full)) return setAttr(tag, "href", styles.get(full));
      const item = images.get(full);
      if (item && attr(tag, "rel") === "preload" && attr(tag, "as") === "image") {
        return setAttr(setAttr(setAttr(tag, "href", item.small.url), "media", "(max-width: 700px)"), "fetchpriority", "high") + setAttr(setAttr(setAttr(tag, "href", item.largest.url), "media", "(min-width: 701px)"), "fetchpriority", "high");
      }
      return tag;
    }).replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_, attrs, css) => `<style${attrs}>${transform({ filename: file, code: Buffer.from(replaceCss(css, file)), minify: true }).code}</style>`);
    // Existing CSS backgrounds use these variables on both phone and desktop.
    const fontHints = [...fontLinks].map((url) => `<link rel="stylesheet" href="${url}">`).join("");
    const connections = fontHints ? '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' : "";
    let heroPreload = "";
    if (cic && file === path.join(root, "index.html")) {
      const hero = images.get(path.join(root, "assets/hero-mountain-path.jpg"));
      if (hero) heroPreload = `<link rel="preload" as="image" href="${hero.small.url}" media="(max-width: 700px)" fetchpriority="high"><link rel="preload" as="image" href="${hero.largest.url}" media="(min-width: 701px)" fetchpriority="high">`;
    }
    html = html.replace(/<\/head>/i, `${connections}${fontHints}${heroPreload}${variables}</head>`);
    // A same-origin preconnect cannot establish anything earlier than the document.
    html = html.replace(/<link\b(?=[^>]*rel="preconnect")(?=[^>]*href="\/")[^>]*>/gi, "");
    await writeFile(file, html);
    report.htmlPages++;
  }
  const headersPath = path.join(root, "_headers");
  let headers = await readFile(headersPath, "utf8").catch(() => "");
  headers += "\n/assets/optimized/*\n  Cache-Control: public, max-age=31536000, immutable\n";
  await writeFile(headersPath, headers);
  console.log(JSON.stringify(report, null, 2));
  return report;
}
