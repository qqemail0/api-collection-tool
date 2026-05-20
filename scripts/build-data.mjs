import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outputDir = path.join(root, "public", "data");
const outputFile = path.join(outputDir, "apis.json");
const defaultLocalReadme = path.join(root, "source", "public-apis", "README.md");
const fallbackReadmeUrl = "https://raw.githubusercontent.com/public-apis/public-apis/master/README.md";

const categoryMeta = {
  "Animals": ["动物与自然", "宠物、野生动物、物种信息、趣味图片"],
  "Anime": ["动漫内容", "动漫资料、语录、角色、追番应用"],
  "Anti-Malware": ["安全反恶意软件", "威胁情报、恶意链接检测、文件信誉"],
  "Art & Design": ["艺术与设计", "设计素材、颜色、艺术馆藏、创意工具"],
  "Authentication & Authorization": ["身份认证", "登录、授权、OAuth、用户身份验证"],
  "Blockchain": ["区块链", "链上数据、钱包、合约、区块浏览"],
  "Books": ["图书阅读", "书籍检索、ISBN、图书馆、阅读应用"],
  "Business": ["商业服务", "企业数据、客户信息、市场与运营"],
  "Calendar": ["日历时间", "节假日、日期、时间、排期"],
  "Cloud Storage & File Sharing": ["云存储与文件", "文件上传、网盘、分享、对象存储"],
  "Continuous Integration": ["持续集成", "构建状态、CI/CD、自动化部署"],
  "Cryptocurrency": ["加密货币", "行情、交易所、链上资产、加密金融"],
  "Currency Exchange": ["汇率换算", "外汇、货币转换、价格换算"],
  "Data Validation": ["数据校验", "邮箱、号码、地址、身份与格式验证"],
  "Development": ["开发工具", "开发者工具、调试、代码、站点监测"],
  "Dictionaries": ["词典语言", "释义、翻译、词库、语言学习"],
  "Documents & Productivity": ["文档效率", "办公、PDF、文档处理、生产力"],
  "Email": ["邮件服务", "邮件发送、验证、临时邮箱、收件箱"],
  "Entertainment": ["娱乐内容", "影视、笑话、趣味内容、休闲产品"],
  "Environment": ["环境生态", "气候、空气质量、自然资源、环保数据"],
  "Events": ["活动事件", "会议、票务、城市活动、日程"],
  "Finance": ["金融数据", "股票、财务、市场、企业金融"],
  "Food & Drink": ["餐饮食谱", "食谱、饮品、营养、餐厅"],
  "Games & Comics": ["游戏漫画", "游戏资料、漫画、电竞、娱乐数据"],
  "Geocoding": ["地理编码", "地图、坐标、位置、地址解析"],
  "Government": ["政府公共数据", "政务开放数据、法律、统计、公共服务"],
  "Health": ["健康医疗", "健康数据、医疗信息、药品、运动健康"],
  "Jobs": ["招聘岗位", "职位搜索、远程工作、招聘信息"],
  "Machine Learning": ["机器学习", "AI、预测、模型服务、数据智能"],
  "Music": ["音乐音频", "歌曲、专辑、歌词、音频数据"],
  "News": ["新闻资讯", "新闻聚合、媒体、热点内容"],
  "Open Data": ["开放数据", "公共数据集、研究数据、城市数据"],
  "Open Source Projects": ["开源项目", "代码托管、开源统计、项目发现"],
  "Patent": ["专利知识产权", "专利查询、知识产权检索"],
  "Personality": ["个性化与趣味", "头像、人格、随机内容、社交趣味"],
  "Phone": ["电话通信", "号码归属、短信、电话验证"],
  "Photography": ["图片摄影", "图片素材、摄影作品、图像服务"],
  "Programming": ["编程学习", "代码题、语言资料、开发学习"],
  "Science & Math": ["科学数学", "科研数据、公式、单位、数学计算"],
  "Security": ["网络安全", "漏洞、威胁、证书、域名与安全检测"],
  "Shopping": ["电商购物", "商品、价格、优惠、购物数据"],
  "Social": ["社交媒体", "社交平台、用户、内容、关系链"],
  "Sports & Fitness": ["运动健身", "赛程、球队、健身、运动数据"],
  "Test Data": ["测试数据", "假数据、占位图、随机内容、原型测试"],
  "Text Analysis": ["文本分析", "NLP、情感分析、文本处理"],
  "Tracking": ["物流追踪", "快递、包裹、航运、状态跟踪"],
  "Transportation": ["交通出行", "航班、公交、铁路、车辆、路线"],
  "URL Shorteners": ["短链接", "链接压缩、跳转、营销追踪"],
  "Vehicle": ["车辆交通", "汽车信息、车牌、车辆数据"],
  "Video": ["视频媒体", "视频平台、流媒体、字幕、剪辑"],
  "Weather": ["天气气象", "天气预报、气象观测、灾害提醒"]
};

async function readSourceMarkdown() {
  const requestedPath = process.env.PUBLIC_APIS_README || defaultLocalReadme;

  try {
    const local = await fs.readFile(requestedPath, "utf8");
    if (local.includes("### Animals") && local.includes("API | Description")) {
      return {
        type: "local-readme",
        location: requestedPath,
        text: local
      };
    }
  } catch {
    // The local reference project can be a skeleton copy without README data.
  }

  const response = await fetch(fallbackReadmeUrl, {
    headers: {
      "user-agent": "api-collection-tool/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to download public-apis README: ${response.status}`);
  }

  return {
    type: "official-remote-readme",
    location: fallbackReadmeUrl,
    text: await response.text()
  };
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function clean(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRow(line) {
  if (!line.startsWith("|") || !line.includes("](")) return null;
  const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
  if (cells.length < 5) return null;

  const titleMatch = cells[0].match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
  if (!titleMatch) return null;

  return {
    name: clean(titleMatch[1]),
    url: clean(titleMatch[2]),
    description: clean(cells[1]),
    auth: clean(cells[2]) || "Unknown",
    https: clean(cells[3]) || "Unknown",
    cors: clean(cells[4]) || "Unknown"
  };
}

function authAdvice(auth) {
  if (auth === "No") return "无需认证即可开始测试；正式上线前仍要查看文档中的频率限制和使用条款。";
  if (auth === "apiKey") return "先在服务官网申请 API Key；后端保存密钥，前端只调用你的后端接口。";
  if (auth === "OAuth") return "按 OAuth 流程获取 access_token；适合有用户授权、账号数据或第三方登录的场景。";
  if (auth === "User-Agent") return "请求头里添加清晰的 User-Agent，说明你的应用名称和联系方式。";
  if (auth === "X-Mashape-Key") return "通常需要在 RapidAPI/Mashape 控制台申请 Key，并通过 X-Mashape-Key 请求头发送。";
  return "认证方式需要查看官方文档确认，建议先在后端封装一次再开放给前端。";
}

function corsAdvice(cors) {
  if (cors === "Yes") return "支持 CORS，可以在浏览器端直接调用；涉及密钥时仍建议走后端代理。";
  if (cors === "No") return "不支持 CORS，浏览器会被拦截；建议通过 Node、Python、Java、Kotlin 或 C# 后端代理调用。";
  return "CORS 状态未知；先用浏览器控制台或测试页面验证，生产环境建议后端调用。";
}

function httpsAdvice(https) {
  if (https === "Yes") return "支持 HTTPS，适合生产环境；仍要设置超时、重试和错误兜底。";
  if (https === "No") return "不支持 HTTPS，不建议传输用户隐私或密钥；如必须使用，放到服务端并限制数据范围。";
  return "HTTPS 状态未知；接入前确认是否能稳定使用安全连接。";
}

function buildPurpose(api) {
  const meta = categoryMeta[api.category] || [api.category, "通用数据能力"];
  const desc = api.description.replace(/[.!。]+$/g, "");
  return `${api.name} 用于${meta[0]}场景，核心能力是${desc}。适合把${meta[1]}快速接入网站、移动 App、后台系统或自动化脚本。`;
}

function buildUseCases(api) {
  const meta = categoryMeta[api.category] || [api.category, "通用数据能力"];
  return [
    `为${meta[0]}产品补充外部数据或功能模块`,
    `在原型、MVP、内部工具中快速验证${api.description}`,
    `作为后端聚合服务、数据看板或自动化流程的数据来源`
  ];
}

function buildUsage(api) {
  return [
    "打开官方文档，确认可用端点、参数、响应字段、配额和服务条款。",
    authAdvice(api.auth),
    corsAdvice(api.cors),
    httpsAdvice(api.https),
    "在业务代码中加入超时、错误提示、缓存和日志；不要把密钥硬编码到公开仓库或前端页面。"
  ];
}

function buildNotes(api) {
  const notes = [];
  if (api.auth !== "No") notes.push("需要认证，密钥应放在服务端或安全环境变量中。");
  if (api.cors !== "Yes") notes.push("浏览器直连可能失败，建议准备后端代理。");
  if (api.https !== "Yes") notes.push("安全连接能力不足，不适合传输敏感数据。");
  if (!notes.length) notes.push("接入门槛较低，适合先用前端或脚本做快速验证。");
  return notes;
}

function sampleRequest(api) {
  const headers = ["-H \"Accept: application/json\""];
  if (api.auth === "apiKey") headers.push("-H \"Authorization: Bearer YOUR_API_KEY\"");
  if (api.auth === "OAuth") headers.push("-H \"Authorization: Bearer YOUR_ACCESS_TOKEN\"");
  if (api.auth === "User-Agent") headers.push("-H \"User-Agent: YourAppName/1.0\"");
  if (api.auth === "X-Mashape-Key") headers.push("-H \"X-Mashape-Key: YOUR_RAPIDAPI_KEY\"");

  const parts = [`curl -L "${api.url.replace(/"/g, "\\\"")}"`, ...headers.map((header) => `  ${header}`)];
  return parts.map((line, index) => index < parts.length - 1 ? `${line} \\` : line).join("\n");
}

function parseApis(source) {
  const lines = source.text.split(/\r?\n/);
  const apis = [];
  const categoryCounts = new Map();
  let category = "";

  for (const line of lines) {
    const categoryMatch = line.match(/^###\s+(.+?)\s*$/);
    if (categoryMatch) {
      category = clean(categoryMatch[1]);
      continue;
    }

    if (!category) continue;
    const parsed = parseRow(line);
    if (!parsed) continue;

    const count = (categoryCounts.get(category) || 0) + 1;
    categoryCounts.set(category, count);

    const base = {
      ...parsed,
      id: `${slugify(category)}-${slugify(parsed.name)}-${count}`,
      category,
      categoryZh: (categoryMeta[category] || [category])[0],
      source: source.type,
      sourceLocation: source.location
    };

    apis.push({
      ...base,
      purpose: buildPurpose(base),
      usage: buildUsage(base),
      useCases: buildUseCases(base),
      notes: buildNotes(base),
      sampleRequest: sampleRequest(base),
      tags: [
        base.category,
        base.categoryZh,
        base.auth,
        `HTTPS ${base.https}`,
        `CORS ${base.cors}`,
        ...base.description.split(/[^A-Za-z0-9]+/).filter((word) => word.length > 4).slice(0, 8)
      ]
    });
  }

  const categories = [...categoryCounts.entries()].map(([name, count]) => ({
    name,
    zh: (categoryMeta[name] || [name])[0],
    description: (categoryMeta[name] || [name, "通用 API"])[1],
    slug: slugify(name),
    count
  }));

  return { apis, categories };
}

async function main() {
  const source = await readSourceMarkdown();
  const { apis, categories } = parseApis(source);

  if (apis.length < 100) {
    throw new Error(`Parsed only ${apis.length} APIs; source format may have changed.`);
  }

  await fs.mkdir(outputDir, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    title: "API合集工具",
    source: {
      type: source.type,
      location: source.location,
      referenceProject: "public-apis compatible README"
    },
    totals: {
      apis: apis.length,
      categories: categories.length,
      noAuth: apis.filter((api) => api.auth === "No").length,
      browserReady: apis.filter((api) => api.cors === "Yes" && api.https === "Yes").length
    },
    categories,
    apis
  };

  await fs.writeFile(outputFile, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Generated ${apis.length} APIs across ${categories.length} categories.`);
  console.log(`Data written to ${path.relative(root, outputFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
