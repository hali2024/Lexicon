# Lexicon 项目交接记录

更新时间：2026-09-18  
工作目录：`C:\Users\HUAWEI\GITHUB\Lexicon`  
远程仓库：`https://github.com/hali2024/Lexicon.git`  
当前分支：`main`

## 当前任务

参照用户提供的界面图片，重做 Lexicon 的页面 UI 和核心交互，使首页接近图片中的深色书房／词汇工作台风格，同时检查并修复原有代码中的明显问题，最后将修改上传到 GitHub。

## 已完成内容

### 页面和交互

- 首页改造成深色墨绿、奶油白和淡金色的 Word Studio 风格。
- 新增顶部导航、AI 生成／CSV 导入切换、词库预览、学习统计、12 周活动热力图和移动端布局。
- 首页数据来自现有词库与学习记录，不使用参考图中的演示数字。
- 保留原有练习模式、账户功能、词库格式和学习进度格式，避免升级后丢失已有记录。
- 支持词库搜索、从首页进入词库、开始练习并返回首页。
- 移除了会遮挡新界面的可选 Live2D 角色启动逻辑。

### AI 生成逻辑

- 原有“输入指定单词并生成词条”的流程仍可使用，通过 `Use my exact words` 开关进入。
- 新增按主题生成词汇，支持选择 10／20／30 个单词、CEFR 难度和学习目标。
- 服务端增加请求参数校验、重复词校验、超时处理和更明确的错误信息。
- 修复 AI 返回顺序改变时，原代码按照数组下标把释义配给错误单词的问题；现在按单词文本匹配返回词条。
- AI 服务模型可通过 `DEEPSEEK_MODEL` 覆盖，默认仍沿用项目已有模型。

### CSV 和统计修复

- 修复 `partOfSpeech` 表头被转为小写后无法识别的问题。
- 支持 UTF-8 BOM、带逗号的引号字段、双引号转义和多行字段。
- 未闭合引号会明确拒绝，不再静默导入错误数据。
- 重复单词按大小写无关方式去重。
- 支持直接选择 `.csv` 文件，也保留粘贴 CSV 和下载模板。
- 连续学习天数允许“今天尚未学习，但昨天及之前连续学习”的常见情况。
- 热力图会纳入复习活动。
- 首页正确率使用已提交答案数和错误数计算，不把尚未作答的单词浏览次数当作答题次数。
- 返回首页前会保存当前练习进度。

### 工程与依赖

- 新增 `README.md`，记录运行、配置和验证方式。
- 新增 `vocabulary.js`，集中处理 AI 请求校验、主题选词和返回词条匹配。
- 新增 `public/studio.css` 和 `public/studio.js`。
- 新增页面流程测试和逻辑测试。
- `nodemailer` 已升级到 `10.0.10`，修复依赖审计报告的已知漏洞。
- 最后一次 `npm audit` 结果为 0 个已知漏洞。

## 验证结果

执行命令：

```powershell
npm.cmd test
```

结果：11 项测试全部通过。覆盖内容包括：

- 页面脚本语法和访客首页初始化。
- AI／CSV 标签切换。
- CSV 导入、保存词库、搜索、进入练习、返回首页及进度保存。
- CSV 引号、逗号、换行、词性表头、重复词和错误引号。
- 连续学习天数、复习热力图和正确率。
- AI 参数校验、失败后的按钮恢复、返回数量校验和释义按单词匹配。

本地服务曾成功启动并通过以下检查：

- `/` 返回 200。
- `/studio.css` 和 `/studio.js` 返回 200。
- `/api/site/status` 返回 200。
- 无效生成参数返回 400。
- 未配置 AI 密钥时返回明确的 502 错误。
- 邮件内容生成测试通过，测试未实际发送邮件。

## Git 状态

改版已提交：

```text
0fd3e21 Redesign Lexicon studio and fix vocabulary workflows
```

用户执行过：

```powershell
git add .
git commit -m "Redesign Lexicon studio and fix vocabulary workflows"
git push origin main
```

提交成功，但用户展示的 `git push` 因 GitHub 旧凭据失效而报错：

```text
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/hali2024/Lexicon.git/'
```

当前本地检查显示 `HEAD` 和本地保存的 `origin/main` 引用都指向 `0fd3e21`，工作树在创建本交接文档前是干净的。但由于用户展示的推送命令明确失败，不能仅凭本地远程跟踪引用确认 GitHub 网站已经收到提交；完成登录后应重新执行 `git push` 并查看命令结果或仓库网页。

本交接文档本身是在上述提交之后新增的，因此需要再次提交。

## 当前卡住的问题

### GitHub 身份认证

本机有 Git Credential Manager `2.6.1`，但缓存的 GitHub 用户名或令牌无效。GitHub 已不支持使用账户密码执行 HTTPS Git 推送。

建议执行：

```powershell
git credential-manager github login --username hali2024 --browser --force
```

如果浏览器登录无法打开，使用设备验证码：

```powershell
git credential-manager github login --username hali2024 --device --force
```

登录成功后再推送。

### 无法完成浏览器截图验收

会话中的 Browser 工具没有可用浏览器连接，因此没有对实际渲染页面做截图对比。已用 DOM 流程测试代替验证结构和关键交互，但下一位接手者仍应在真实浏览器中检查桌面端和手机端视觉效果。

### 真实 AI 生成尚未联调

当前环境没有 `DEEPSEEK_API_KEY`，所以主题生成和精确单词生成没有调用真实 DeepSeek 服务。请求校验、错误处理及模拟返回均已测试。部署环境需要配置：

```text
DEEPSEEK_API_KEY=...
```

可选配置：

```text
DEEPSEEK_MODEL=...
```

不要把密钥提交进 Git；`.env` 已在 `.gitignore` 中。

## 下一步计划

1. 在真实浏览器打开 `http://localhost:3000`，检查 1440px、平板和手机宽度下的首页、弹窗、练习页和设置页。
2. 在部署环境设置 `DEEPSEEK_API_KEY`，分别测试主题生成和 `Use my exact words`。
3. 重新登录 GitHub，并提交本交接文档：

   ```powershell
   git add handoff.md
   git commit -m "Add project handoff notes"
   git push origin main
   ```

4. 打开 GitHub 仓库网页确认最新提交存在。
5. 如果项目托管在 Railway 或其他平台，确认部署环境的 Node 版本符合 `package.json`：`^20.19.0 || ^22.13.0 || >=24.0.0`，并检查部署日志。

## 踩过的坑

- Windows PowerShell 的执行策略会阻止 `npm.ps1`，因此应使用 `npm.cmd install`、`npm.cmd test` 和 `npm.cmd start`。
- `git add` 出现 `LF will be replaced by CRLF` 只是换行转换提醒，不是提交失败，也不影响上传。
- 初次在受限环境安装依赖会因网络／缓存权限失败；获得网络权限后安装成功。
- `npm install` 最初发现 `nodemailer` 高危漏洞；升级到 `10.0.10` 后审计归零。
- 原 CSV 代码先把表头全部转成小写，却继续查找 `partOfSpeech`，因此驼峰表头始终匹配不到。
- 原 AI 代码强制把返回数组第 N 项改名为请求数组第 N 个单词。如果 AI 调整了顺序，单词和释义会错配。
- 统计中的 `practised` 在题目展示时就增加，不能直接作为正确率分母；正确率应使用真正提交过的题目数。
- 浏览器工具不可用时不能把 DOM 测试当作视觉验收；它只能证明结构和交互逻辑基本可运行。
- 一开始分开执行页面脚本会造成测试作用域差异；最终测试把外部脚本和内联脚本放在同一个浏览器作用域中执行。
- 主题生成测试使用受控模拟返回，不代表第三方 API 当前一定可用。

## 关键文件

- `public/index.html`：原应用主体、练习／账户／词库逻辑及新版首页结构。
- `public/studio.css`：新版 Word Studio 和响应式视觉样式。
- `public/studio.js`：首页导航、CSV 文件读取、词库预览、统计及热力图。
- `server.js`：Express API、账户、持久化和 DeepSeek 词条生成。
- `vocabulary.js`：生成请求校验、主题选词及 AI 返回词条匹配。
- `tests/page.test.cjs`：完整页面和用户流程测试。
- `tests/studio.test.cjs`：CSV、统计及 AI 逻辑测试。
- `README.md`：运行和环境配置说明。

