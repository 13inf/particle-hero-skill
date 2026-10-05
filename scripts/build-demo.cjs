// Generate anonymous previews from the saved particle algorithm and unbranded artwork.
const fs = require("node:fs");
const path = require("node:path");
const ts = require(require.resolve("typescript", { paths: [process.cwd()] }));
const root = path.resolve(__dirname, "..");
const component = fs.readFileSync(path.join(root, "assets/react/hero-particle-art.tsx"), "utf8");
const start = component.indexOf("  useEffect(() => {") + "  useEffect(() => {".length;
const end = component.indexOf("  }, [composition]);", start);
if (start < 20 || end < start) throw new Error("Particle effect body not found");
const imageUri = "data:image/webp;base64," + fs.readFileSync(path.join(root, "assets/lineart/particle-bag.webp")).toString("base64");
const hashStart = component.indexOf("const hash =");
const hashEnd = component.indexOf("export default", hashStart);
const source = `type Particle = { x: number; y: number; rx: number; ry: number; radius: number; alpha: number; heat: number };
type Sample = { x: number; y: number; dark: number };
${component.slice(hashStart, hashEnd)}
const composition = "diagonal";
const canvasRef = { current: document.querySelector<HTMLCanvasElement>("canvas") };
const setFailed = (failed: boolean) => { if (failed) document.getElementById("status")!.textContent = "素材或画布加载失败"; };
const dispose = (() => {${component.slice(start, end).replace('image.src = "/images/hero/particle-bag.webp";', `image.src = ${JSON.stringify(imageUri)};`)} })();
window.addEventListener("pagehide", () => dispose?.(), {once:true});`;
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None } }).outputText;
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>粒子效果 · 手机自动扫光</title><style>
*{box-sizing:border-box}html,body{margin:0;background:#0a100e;color:#f7f9f8;font-family:system-ui,"Microsoft YaHei",sans-serif}section{--color-accent-light:#9bb8fe;position:relative;min-height:100svh;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:110px 20px 72px}canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.text-center{position:relative;z-index:1;text-align:center;max-width:850px;width:100%;pointer-events:none}.text-center a{pointer-events:auto}header{position:absolute;top:24px;left:24px;right:24px;display:flex;justify-content:space-between;z-index:2;color:#b9c5c0;font-size:14px}h1{font-size:clamp(44px,8vw,86px);letter-spacing:-.035em;line-height:1.02;margin:26px 0}h1 span{display:block;color:#9bb8fe;margin-top:12px}p{font-size:17px;color:#bdc6c2;line-height:1.8;max-width:580px;margin:24px auto}.eyebrow{color:#9bb8fe;font-size:15px}.buttons{display:flex;justify-content:center;gap:14px;margin-top:32px}a{color:inherit;text-decoration:none;min-height:48px;border-radius:100px;border:1px solid #65746d;padding:14px 26px;font-size:14px}a:first-child{color:#0a100e;background:#f4f7f5;border-color:#f4f7f5}#status{position:absolute;bottom:25px;left:20px;right:20px;font-size:12px;text-align:center;color:#a8b6ae}.after{min-height:90vh;padding:50px;text-align:center;background:#19231d}@media(max-width:767px){header{top:22px;left:20px;right:20px;font-size:12px}h1{font-size:clamp(42px,12vw,64px)}p{font-size:15px}.buttons{flex-direction:column;gap:12px}.text-center{max-width:600px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style></head><body><section id="home"><header><b>粒子效果演示</b><span>通用示例</span></header><canvas aria-hidden="true"></canvas><div class="text-center"><div class="eyebrow">Canvas 线稿点阵</div><h1>交互与回位<span>手机自动扫光</span></h1><p>桌面移动鼠标观察粒子推散。手机无需触摸，光带自动扫过，保持中央内容清晰。</p><div class="buttons"><a href="#details">查看效果说明</a><a href="particle-bag.html">参数调节演示</a></div></div><div id="status">桌面鼠标交互 · 手机自动扫描 · 减少动态效果时静态展示</div></section><div class="after" id="details"><h2>效果说明</h2><p>8 秒循环，5.8 秒扫描。滚动离开首屏暂停，返回恢复。</p><p>本示例不包含公司、客户照片或联系方式。</p><a href="#home">回到粒子画面</a></div><script>${js}</script></body></html>`;
const homeOnly = html
  .replace(/<div class="after" id="details">.*?<script>/s, "<script>")
  .replace("Canvas 线稿点阵", "线稿点阵")
  .replace('<a href="#details">查看效果说明</a>', "");
fs.writeFileSync(path.join(root, "assets/demos/particle-mobile.html"), homeOnly);
// Regenerate the earlier demo with anonymous text and no customer photographs.
const earlyPath = path.join(root, "assets/demos/particle-bag.html");
let early = fs.readFileSync(earlyPath, "utf8");
early = early.replace(/<title>.*?<\/title>/, "<title>粒子布袋 · 参数调节演示</title>")
  .replace(/<header class="nav wrap">.*?<\/header>/s, '<header class="nav wrap"><a class="brand" href="#home">粒子效果演示</a><button class="adjust" id="adjust" aria-expanded="false" aria-controls="panel">调整效果 ↗</button></header>')
  .replace(/<div class="copy">.*?<\/div>\s*<div class="art"/s, '<div class="copy"><div class="eyebrow">黑白线稿 · 粒子点阵</div><h1 id="hero-title">线稿粒子交互<span>推散与回位</span></h1><p class="intro">移动鼠标观察提亮、散开与柔和回位。手机使用静态点阵。</p><div class="actions"><a class="btn primary" href="particle-mobile.html">手机扫光版本</a></div></div><div class="art"')
  .replace(/<div class="hero-foot wrap">.*?<\/div>/s, "")
  .replace(/<section class="products wrap".*?<\/section>/s, "")
  .replace(/<section class="contact wrap".*?<\/section>/s, "")
  .replace("品牌蓝", "蓝紫色");
fs.writeFileSync(earlyPath, early);
console.log("Generated two anonymous single-file demos.");
