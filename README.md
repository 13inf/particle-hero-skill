# Particle Hero Skill

将线稿转换为粒子首页：桌面鼠标靠近时散开、提亮，离开后回位；手机无需触摸，自动扫光并恢复轮廓。

支持 Codex 技能调用，也提供可直接打开的单文件演示和可迁移的 React 组件。全部示例使用通用文案与无品牌素材，只保留首页。

![桌面演示](assets/previews/desktop.png)

<img src="assets/previews/mobile.png" alt="手机自动扫光演示" width="320">

## 安装技能

Windows / PowerShell：

```powershell
$skillDir = Join-Path $env:USERPROFILE '.codex\skills\particle-hero'
if (Test-Path -LiteralPath $skillDir) { throw '技能目录已存在，请先检查已有版本' }
git clone https://github.com/13inf/particle-hero-skill.git $skillDir
```

macOS / Linux：

```sh
git clone https://github.com/13inf/particle-hero-skill.git ~/.codex/skills/particle-hero
```

如果使用自定义 `CODEX_HOME`，安装到对应目录下的 `skills/particle-hero`。技能列表刷新后，可使用：

```text
使用 $particle-hero 为这个网页接入线稿粒子首页，
保留现有文字和按钮，桌面鼠标推散，手机自动扫光。
```

也可以直接将 [SKILL.md](SKILL.md) 与其引用的文件提供给支持本地技能的助手。

## 直接体验

下载或克隆仓库后，在浏览器打开：

- [最终演示](assets/demos/particle-mobile.html)：桌面交互，手机自动扫光。
- [参数调节演示](assets/demos/particle-bag.html)：调整颜色、密度、作用范围和力度；此演示的手机端是早期静态版本。

HTML 已内嵌图片，运行时不请求远程图片、字体或脚本。两个文件都只展示首页。开发预览也可在仓库根目录运行：

```text
python -m http.server 4173
```

然后打开 `http://127.0.0.1:4173/assets/demos/particle-mobile.html`。

## 接入项目

将 [React 组件](assets/react/hero-particle-art.tsx) 与 [线稿素材](assets/lineart/particle-bag.webp) 复制到自己的工程，按 [接入说明](references/integration.md) 设置相对位置、素材 URL 与内容层。

三种构图：`corner`（两角布袋与布纹）、`weave`（两侧布纹）、`diagonal`（斜向布袋）。默认演示使用 `diagonal`。

最终手机扫光每轮 8 秒，其中 5.8 秒扫描；最多 4,400 点、DPR 上限 1.5、目标绘制频率 30fps。更多可调参数见 [参数说明](references/parameters.md)。

## 修改后重建

```text
npm ci
npm run typecheck
npm run build
```

构建脚本从最终 React 组件提取同一份绘制逻辑，再内嵌线稿生成最终 HTML。参数调节演示保留它自己的早期交互逻辑，不会因重建变成手机扫光版。

开发依赖只用于类型检查和生成演示；直接查看 HTML 不需要 Node.js 或 React。

## 素材与验证范围

代码采用 MIT 许可证。附带线稿由 AI 生成，不包含客户照片、商标或联系方式，可作为通用示例使用；请勿将生成素材表述为真实产品照片。

公开网页的线稿点阵是视觉思路参考。本仓库没有打包第三方网站的图片或代码。

已使用 Edge 浏览器模拟检查桌面交互、手机自动扫光、静态降级、布局与运行异常。粒子上限与 30fps 是配置目标；真实手机的持续性能、发热和耗电未测量。

## 许可证

[MIT](LICENSE)。
