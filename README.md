# 问道

问道是一套手机优先的生辰取名与公司起名工具。四柱、五行、音律、字义、康熙笔画和综合衡分都由浏览器里的固定规则完成；模型只负责把已经算好的结果整理成易读报告，不参与改分。

## 架构

```text
浏览器固定规则 ── 立即生成名字与分项分数
       └──── 用户主动点击 ── /api/ai/explain ── Cloudflare Workers AI
                                  └──── 超时或不可用 ── 本地规则解读
```

- 不要求用户登录，不保存出生日期，名册只保存在当前设备。
- 发给模型的是五行结论、分项分数和候选名，不包含原始出生年月日。
- 一次最多比较三个候选，平台限制一分钟三次，另有每日八次轻量限额，结果缓存七天。
- 模型、网络或额度故障时自动降级，取名和评分始终可用。

## 本地运行

```bash
npm install
npm run dev
```

没有Cloudflare账号也能开发和测试；点击“深度解读”时会自动使用本地规则。`127.0.0.1`只供当前电脑预览，手机测试需要使用同一局域网中的电脑地址。

## Cloudflare部署

项目使用Cloudflare官方Vite插件，配置位于`wrangler.jsonc`。首次部署：

```bash
npx wrangler login
npm run cf:typegen
npm run deploy
```

默认模型是`@cf/zai-org/glm-4.7-flash`，通过Workers AI绑定调用，不需要把API密钥写进网页。

如需切换到任意OpenAI兼容服务，将`AI_PROVIDER`设为`openai-compatible`，配置`AI_BASE_URL`和`AI_MODEL`，并用下列命令保存密钥：

```bash
npx wrangler secret put AI_API_KEY
```

不要提交`.dev.vars`、`.env`或任何真实密钥。

## 检查

```bash
npm run typecheck
npm test
npm run build
```
