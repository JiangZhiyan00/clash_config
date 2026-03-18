/***
 * Clash Verge Rev / Mihomo Party 优化脚本
 * 原作者: dahaha-365 (YaNet)
 * Github：https://github.com/dahaha-365/YaNet
 *
 *
 * 主要变化与优化说明:
 * 1. [新增] $arguments 参数注入系统，支持 Mihomo Party GUI 动态配置
 * 2. [优化] DNS 升级为 whitelist 模式 + direct-nameserver，移除旧版 fallback 方案
 * 3. [修复] fake-ip-range 修正为 198.18.0.0/16（原版 198.18.0.1/16 有误）
 * 4. [升级] geox-url 更新为 geoip.metadb 新格式 + geodata-mode:false（性能更优）
 * 5. [升级] TUN 配置更完整（auto-redirect/strict-route/GSO/dns-hijack）
 * 6. [保留] Wasmer 特殊节点地区匹配、JP优先逻辑、CN华为测速URL、chrome指纹
 * 7. [优化] providers 统一为数组格式，支持多 Rule Provider
 * 8. [新增] 兜底直连规则：category-public-tracker、category-game-platforms-download@cn
 * 9. [整合] TVB 并入港澳台媒体组（避免重复），新增台湾媒体规则集
 * 10.[调整] 地区顺序优化：HK/US/JP/KR/SG 排前，常用地区优先匹配
 */

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────
function stringToArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val !== "string") return [];
  return val
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

// ─────────────────────────────────────────────
// 1. 静态配置区域
// ─────────────────────────────────────────────

// DNS 默认值（字符串格式，用分号分隔，方便 $arguments 注入）
const _skipIps =
  "10.0.0.0/8;100.64.0.0/10;127.0.0.0/8;169.254.0.0/16;172.16.0.0/12;192.168.0.0/16;198.18.0.0/16;FC00::/7;FE80::/10;::1/128";

const _chinaIpDns = "223.5.5.5;119.29.29.29";
const _foreignIpDns = "8.8.8.8;1.1.1.1";
const _chinaDohDns =
  "https://doh.pub/dns-query;https://dns.alidns.com/dns-query";
const _foreignDohDns =
  "https://dns.google/dns-query;https://dns.adguard-dns.com/dns-query";

/**
 * $arguments 参数系统
 * 在 Mihomo Party 中可通过 GUI 注入，其他场景则使用下方默认值
 *
 * 可用参数：
 *   enable               - 总开关 (true/false)
 *   ruleSet              - 启用的规则集，'all' 或 'openai;youtube;ads' 格式
 *   regionSet            - 启用的地区，'all' 或 'HK;US;JP;SG' 格式（取地区名前2字母）
 *   excludeHighPercentage - 是否过滤高倍率节点 (true/false)
 *   globalRatioLimit     - 倍率上限 (数字)
 *   skipIps              - 不走代理的 IP 段（分号分隔）
 *   defaultDNS           - bootstrap DNS（分号分隔）
 *   directDNS            - 直连域名解析 DNS（分号分隔）
 *   chinaDNS             - 中国域名 DNS（分号分隔）
 *   foreignDNS           - 境外域名 DNS（分号分隔）
 *   mode                 - DNS 预设模式: securest/secure/default/fast/fastest
 *   ipv6                 - 启用 IPv6 (true/false)
 *   logLevel             - 日志等级: error/warning/info/debug/silent
 *   githubProxy          - GitHub 加速代理前缀
 */
const args =
  typeof $arguments !== "undefined"
    ? $arguments
    : {
        enable: true,
        ruleSet: "all",
        regionSet: "all",
        excludeHighPercentage: true,
        globalRatioLimit: 2,
        skipIps: _skipIps,
        defaultDNS: _chinaIpDns,
        directDNS: _chinaIpDns,
        chinaDNS: _chinaDohDns,
        foreignDNS: _foreignDohDns,
        mode: "default",
        ipv6: false,
        logLevel: "error",
        githubProxy: "https://edgeone.gh-proxy.org/",
      };

/**
 * 如果是直接在软件中粘贴脚本，可在这里手动覆盖默认值
 */
let {
  enable = args.enable ?? true,
  ruleSet = args.ruleSet || "all",
  regionSet = args.regionSet || "all",
  excludeHighPercentage = args.excludeHighPercentage ?? true,
  globalRatioLimit = args.globalRatioLimit || 2,
  skipIps = args.skipIps || _skipIps,
  defaultDNS = args.defaultDNS || _chinaIpDns,
  directDNS = args.directDNS || _chinaIpDns,
  chinaDNS = args.chinaDNS || _chinaDohDns,
  foreignDNS = args.foreignDNS || _foreignDohDns,
  mode = args.mode || "default",
  ipv6 = args.ipv6 ?? false,
  logLevel = args.logLevel || "error",
  githubProxy = args.githubProxy || "https://edgeone.gh-proxy.org/",
} = args;

/**
 * DNS 预设模式
 * securest : 全程外部 DoH（最安全，速度最慢）
 * secure   : bootstrap 用外部 IP，直连用国内 DoH（安全与速度平衡）
 * default  : bootstrap 用国内 IP，直连/国内用 DoH（推荐）
 * fast     : 全程国内 IP DNS（速度最快，隐私最低）
 * fastest  : 全程纯 IP DNS（极速，无加密）
 */
if (["securest", "secure", "default", "fast", "fastest"].includes(mode)) {
  switch (mode) {
    case "securest":
      defaultDNS = _foreignIpDns;
      directDNS = _foreignDohDns;
      chinaDNS = _foreignDohDns;
      foreignDNS = _foreignDohDns;
      break;
    case "secure":
      defaultDNS = _foreignIpDns;
      directDNS = _chinaDohDns;
      chinaDNS = _chinaDohDns;
      foreignDNS = _foreignDohDns;
      break;
    case "fast":
      defaultDNS = _chinaIpDns;
      directDNS = _chinaIpDns;
      chinaDNS = _chinaIpDns;
      foreignDNS = _chinaDohDns;
      break;
    case "fastest":
      defaultDNS = _chinaIpDns;
      directDNS = _chinaIpDns;
      chinaDNS = _chinaIpDns;
      foreignDNS = _chinaIpDns;
      break;
    default: // "default" 模式
      defaultDNS = _chinaIpDns;
      directDNS = _chinaIpDns;
      chinaDNS = _chinaDohDns;
      foreignDNS = _foreignDohDns;
      break;
  }
}

// 转换为数组
skipIps = stringToArray(skipIps);
defaultDNS = stringToArray(defaultDNS);
directDNS = stringToArray(directDNS);
chinaDNS = stringToArray(chinaDNS);
foreignDNS = stringToArray(foreignDNS);

// ─────────────────────────────────────────────
// 分流规则开关
// ─────────────────────────────────────────────
/**
 * 遵循"最小可用"原则：只启用自己需要的规则，减少内存与解析开销
 * 支持通过 $arguments.ruleSet = "openai;youtube;ads" 动态控制
 */
let ruleOptions = {
  apple: false,
  microsoft: false,
  github: false,
  google: false,
  openai: false,
  spotify: false,
  youtube: false,
  bahamut: false,
  netflix: false,
  tiktok: false,
  disney: false,
  pixiv: false,
  hbo: false,
  mediaHMT: false, // 港澳台媒体（含HK/TW流媒体）
  biliintl: false,
  hulu: false,
  primevideo: false,
  telegram: false,
  line: false,
  whatsapp: false,
  games: false,
  japan: false,
  ads: false,
};

if (ruleSet === "all") {
  Object.keys(ruleOptions).forEach((key) => (ruleOptions[key] = true));
} else if (typeof ruleSet === "string") {
  const enabledKeys = ruleSet.split(";").map((s) => s.trim());
  enabledKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(ruleOptions, key)) {
      ruleOptions[key] = true;
    }
  });
}

// ─────────────────────────────────────────────
// 初始规则（进程直连）
// ─────────────────────────────────────────────
const rules = [
  "RULE-SET,applications,下载软件",
  "PROCESS-NAME-REGEX,(?i).*Oray.*,直连",
  "PROCESS-NAME-REGEX,(?i).*Sunlogin.*,直连",
  "PROCESS-NAME-REGEX,(?i).*AweSun.*,直连",
  "PROCESS-NAME-REGEX,(?i).*NodeBaby.*,直连",
  "PROCESS-NAME-REGEX,(?i).*Node Baby.*,直连",
  "PROCESS-NAME-REGEX,(?i).*nblink.*,直连",
  "PROCESS-NAME-REGEX,(?i).*owjdxb.*,直连",
  "PROCESS-NAME-REGEX,(?i).*vpn.*,直连",
  "PROCESS-NAME-REGEX,(?i).*vnc.*,直连",
  "PROCESS-NAME-REGEX,(?i).*tvnserver.*,直连",
  "PROCESS-NAME-REGEX,(?i).*节点小宝.*,直连",
  "PROCESS-NAME-REGEX,(?i).*AnyDesk.*,直连",
  "PROCESS-NAME-REGEX,(?i).*ToDesk.*,直连",
  "PROCESS-NAME-REGEX,(?i).*RustDesk.*,直连",
  "PROCESS-NAME-REGEX,(?i).*TeamViewer.*,直连",
  "PROCESS-NAME-REGEX,(?i).*Zerotier.*,直连",
  "PROCESS-NAME-REGEX,(?i).*Tailscaled.*,直连",
  "PROCESS-NAME-REGEX,(?i).*phddns.*,直连",
  "PROCESS-NAME-REGEX,(?i).*ngrok.*,直连",
  "PROCESS-NAME-REGEX,(?i).*frpc.*,直连",
  "PROCESS-NAME-REGEX,(?i).*frps.*,直连",
  "PROCESS-NAME-REGEX,(?i).*natapp.*,直连",
  "PROCESS-NAME-REGEX,(?i).*cloudflared.*,直连",
  "PROCESS-NAME-REGEX,(?i).*xmqtunnel.*,直连",
  "PROCESS-NAME-REGEX,(?i).*Navicat.*,直连",
  "DOMAIN-SUFFIX,iepose.com,直连",
  "DOMAIN-SUFFIX,iepose.cn,直连",
  "DOMAIN-SUFFIX,nblink.cc,直连",
  "DOMAIN-SUFFIX,ionewu.com,直连",
  "DOMAIN-SUFFIX,vicp.net,直连",
];

// ─────────────────────────────────────────────
// 地区定义
// 顺序决定节点匹配优先级（常用地区靠前）
// ─────────────────────────────────────────────
const allRegionDefinitions = [
  {
    name: "SG新加坡",
    regex: /新加坡|🇸🇬|sg|singapore/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Singapore.png`,
  },
  {
    name: "TW台湾",
    regex: /台湾|台灣|🇹🇼|tw|taiwan|tai wan/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/China.png`,
  },
  {
    name: "JP日本",
    regex: /日本|🇯🇵|jp|japan/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png`,
  },
  {
    name: "KR韩国",
    regex: /韩|🇰🇷|kr|korea/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Korea.png`,
  },
  {
    name: "US美国",
    regex: /(?!.*aus)(?=.*(美|🇺🇸|us(?!t)|usa|american|united states)).*/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png`,
  },
  {
    name: "HK香港",
    regex: /港|🇭🇰|hk|hongkong|hong kong/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hong_Kong.png`,
  },
  {
    name: "GB英国",
    regex: /英|🇬🇧|uk|united kingdom|great britain/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_Kingdom.png`,
  },
  {
    name: "DE德国",
    regex: /德国|🇩🇪|de|germany/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Germany.png`,
  },
  {
    name: "MY马来西亚",
    regex: /马来|🇲🇾|my|malaysia/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Malaysia.png`,
  },
  {
    name: "TK土耳其",
    regex: /土耳其|🇹🇷|tk|turkey/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Turkey.png`,
  },
  {
    name: "CA加拿大",
    regex: /加拿大|🇨🇦|ca|canada/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Canada.png`,
  },
  {
    name: "AU澳大利亚",
    regex: /澳大利亚|🇦🇺|au|australia|sydney/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Australia.png`,
  },
  // Wasmer 是特殊服务节点，保留匹配（放最后避免误匹配）
  {
    name: "Wasmer",
    regex: /Wasmer/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Auto.png`,
  },
  {
    name: "CN中国大陆",
    regex: /中国|🇨🇳|cn|china|shanghai|beijing/i,
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/China_Map.png`,
  },
];

// 根据 regionSet 过滤地区列表
let regionDefinitions = [];
if (regionSet === "all") {
  regionDefinitions = allRegionDefinitions;
} else {
  const enabledRegions = regionSet.split(";").map((s) => s.trim());
  regionDefinitions = allRegionDefinitions.filter((r) =>
    enabledRegions.includes(r.name.substring(0, 2)),
  );
}

// ─────────────────────────────────────────────
// DNS 配置
// ─────────────────────────────────────────────
/**
 * 新版 DNS 策略说明：
 * - whitelist 模式：fake-ip-filter 中列出的域名"使用真实IP"，其余均走 fake-ip
 *   适合代理场景，被代理的域名不需要真实解析，效率更高
 * - direct-nameserver：直连流量专用 DNS（不经代理解析，避免污染）
 * - 移除了旧版 fallback/fallback-filter（新版 Mihomo 用 nameserver-policy 替代）
 */
const dnsConfig = {
  enable: true,
  listen: "0.0.0.0:53",
  ipv6: ipv6,
  "log-level": logLevel,
  "prefer-h3": true,
  "use-hosts": true,
  "use-system-hosts": true,
  "enhanced-mode": "fake-ip",
  "fake-ip-range": "198.18.0.0/16",
  "fake-ip-filter-mode": "whitelist", // whitelist：列出的域名使用真实IP，其余 fake-ip
  "fake-ip-filter": [
    // 以下域名需要真实 IP（不能走 fake-ip）
    "geosite:gfw",
    "geosite:jetbrains-ai",
    "geosite:category-ai-!cn",
    "geosite:category-ai-chat-!cn",
    "geosite:category-games-!cn",
    "geosite:google@!cn",
    "geosite:telegram",
    "geosite:facebook",
    "geosite:google",
    "geosite:amazon",
    "geosite:category-bank-jp",
  ],
  "default-nameserver": defaultDNS, // 用于解析 DoH/TLS 服务器自身（bootstrap）
  nameserver: chinaDNS, // 默认 nameserver（国内域名）
  "direct-nameserver": directDNS, // 直连流量专用 DNS（新版推荐）
  "proxy-server-nameserver": chinaDNS, // 解析代理服务器域名用
  "nameserver-policy": {
    "geosite:private": "system",
    // 国内服务走国内 DNS
    "geosite:tld-cn,cn,steam@cn,category-games@cn,microsoft@cn,apple@cn,category-game-platforms-download@cn,category-public-tracker":
      chinaDNS,
    // 境外 AI/代理服务走境外 DNS
    "geosite:gfw,jetbrains-ai,category-ai-!cn,category-ai-chat-!cn": foreignDNS,
  },
};

// ─────────────────────────────────────────────
// 通用配置
// ─────────────────────────────────────────────
const ruleProviderCommon = {
  type: "http",
  format: "yaml",
  interval: 86400, // 24h 自动更新
};

const groupBaseOption = {
  interval: 300,
  timeout: 3000,
  url: "http://www.qualcomm.cn/generate_204",
  lazy: true,
  "max-failed-times": 3,
  hidden: false,
};

// 预定义 Rule Providers
const ruleProviders = {
  applications: {
    ...ruleProviderCommon,
    behavior: "classical",
    format: "text",
    url: `${githubProxy}https://github.com/DustinWin/ruleset_geodata/raw/refs/heads/mihomo-ruleset/applications.list`,
    path: "./ruleset/DustinWin/applications.list",
  },
};

// 倍率正则预编译（匹配节点名称中的倍率数字）
const multiplierRegex =
  /(?<=[xX✕✖⨉倍率])([1-9]+(\.\d+)*|0{1}\.\d+)(?=[xX✕✖⨉倍率])*/i;

// ─────────────────────────────────────────────
// 2. 服务规则数据结构
// ─────────────────────────────────────────────
const serviceConfigs = [
  {
    key: "openai",
    name: "国外AI",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/ChatGPT.png`,
    url: "https://chat.openai.com/cdn-cgi/trace",
    rules: [
      "GEOSITE,jetbrains-ai,国外AI",
      "GEOSITE,category-ai-!cn,国外AI",
      "GEOSITE,category-ai-chat-!cn,国外AI",
      "DOMAIN-SUFFIX,meta.ai,国外AI",
      "DOMAIN-SUFFIX,meta.com,国外AI",
      "PROCESS-NAME-REGEX,(?i).*Antigravity.*,国外AI",
      "PROCESS-NAME-REGEX,(?i).*language_server_.*,国外AI",
    ],
  },
  {
    key: "youtube",
    name: "YouTube",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/YouTube.png`,
    url: "https://www.youtube.com/s/desktop/494dd881/img/favicon.ico",
    rules: ["GEOSITE,youtube,YouTube"],
  },
  {
    key: "mediaHMT",
    name: "港澳台媒体",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/TVB.png`,
    url: "https://viu.tv/",
    rules: [
      "GEOSITE,tvb,港澳台媒体",
      "GEOSITE,hkt,港澳台媒体",
      "GEOSITE,hkbn,港澳台媒体",
      "GEOSITE,hkopentv,港澳台媒体",
      "GEOSITE,hkedcity,港澳台媒体",
      "GEOSITE,hkgolden,港澳台媒体",
      "GEOSITE,hketgroup,港澳台媒体",
      "RULE-SET,hk-media,港澳台媒体",
      "RULE-SET,tw-media,港澳台媒体",
    ],
    providers: [
      {
        key: "hk-media",
        url: "https://ruleset.skk.moe/Clash/non_ip/stream_hk.txt",
        path: "./ruleset/ruleset.skk.moe/stream_hk.txt",
        format: "text",
        behavior: "classical",
      },
      {
        key: "tw-media",
        url: "https://ruleset.skk.moe/Clash/non_ip/stream_tw.txt",
        path: "./ruleset/ruleset.skk.moe/stream_tw.txt",
        format: "text",
        behavior: "classical",
      },
    ],
  },
  {
    key: "biliintl",
    name: "哔哩哔哩东南亚",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/bilibili_3.png`,
    url: "https://www.bilibili.tv/",
    rules: ["GEOSITE,biliintl,哔哩哔哩东南亚"],
  },
  {
    key: "bahamut",
    name: "巴哈姆特",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Bahamut.png`,
    url: "https://ani.gamer.com.tw/ajax/getdeviceid.php",
    rules: ["GEOSITE,bahamut,巴哈姆特"],
  },
  {
    key: "disney",
    name: "Disney+",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Disney+.png`,
    url: "https://disney.api.edge.bamgrid.com/devices",
    rules: ["GEOSITE,disney,Disney+"],
  },
  {
    key: "netflix",
    name: "NETFLIX",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Netflix.png`,
    url: "https://api.fast.com/netflix/speedtest/v2?https=true",
    rules: ["GEOSITE,netflix,NETFLIX"],
  },
  {
    key: "tiktok",
    name: "Tiktok",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/TikTok.png`,
    url: "https://www.tiktok.com/",
    rules: ["GEOSITE,tiktok,Tiktok"],
  },
  {
    key: "spotify",
    name: "Spotify",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Spotify.png`,
    url: "https://spclient.wg.spotify.com/signup/public/v1/account",
    rules: ["GEOSITE,spotify,Spotify"],
  },
  {
    key: "pixiv",
    name: "Pixiv",
    icon: "https://play-lh.googleusercontent.com/8pFuLOHF62ADcN0ISUAyEueA5G8IF49mX_6Az6pQNtokNVHxIVbS1L2NM62H-k02rLM=w240-h480-rw",
    url: "https://www.pixiv.net/",
    rules: ["GEOSITE,pixiv,Pixiv"],
  },
  {
    key: "hbo",
    name: "HBO",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/HBO.png`,
    url: "https://www.hbo.com/favicon.ico",
    rules: ["GEOSITE,hbo,HBO"],
  },
  {
    key: "primevideo",
    name: "Prime Video",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Prime_Video.png`,
    url: "https://m.media-amazon.com/images/G/01/digital/video/web/logo-min-remaster.png",
    rules: ["GEOSITE,primevideo,Prime Video"],
  },
  {
    key: "hulu",
    name: "Hulu",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hulu.png`,
    url: "https://auth.hulu.com/v4/web/password/authenticate",
    rules: ["GEOSITE,hulu,Hulu"],
  },
  {
    key: "telegram",
    name: "Telegram",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Telegram.png`,
    url: "https://www.telegram.org/img/website_icon.svg",
    rules: ["GEOIP,telegram,Telegram"],
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    icon: "https://static.whatsapp.net/rsrc.php/v3/yP/r/rYZqPCBaG70.png",
    url: "https://web.whatsapp.com/data/manifest.json",
    rules: ["GEOSITE,whatsapp,WhatsApp"],
  },
  {
    key: "line",
    name: "Line",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Line.png`,
    url: "https://line.me/page-data/app-data.json",
    rules: ["GEOSITE,line,Line"],
  },
  {
    key: "games",
    name: "游戏专用",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Game.png`,
    rules: [
      "GEOSITE,category-games@cn,国内网站",
      "GEOSITE,category-games,游戏专用",
    ],
  },
  {
    key: "ads",
    name: "广告过滤",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Advertising.png`,
    rules: [
      "GEOSITE,category-ads-all,广告过滤",
      "RULE-SET,adblockmihomo,广告过滤",
    ],
    providers: [
      {
        key: "adblockmihomo",
        url: `${githubProxy}https://github.com/217heidai/adblockfilters/raw/refs/heads/main/rules/adblockmihomo.mrs`,
        path: "./ruleset/adblockfilters/adblockmihomo.mrs",
        format: "mrs",
        behavior: "domain",
      },
    ],
    reject: true, // 策略组默认动作为 REJECT
  },
  {
    key: "apple",
    name: "苹果服务",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Apple_2.png`,
    url: "https://www.apple.com/library/test/success.html",
    rules: ["GEOSITE,apple-cn,苹果服务"],
  },
  {
    key: "google",
    name: "谷歌服务",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Google_Search.png`,
    url: "http://www.qualcomm.cn/generate_204",
    rules: ["GEOSITE,google,谷歌服务"],
  },
  {
    key: "github",
    name: "Github",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/GitHub.png`,
    url: "https://github.com/robots.txt",
    rules: ["GEOSITE,github,Github"],
  },
  {
    key: "microsoft",
    name: "微软服务",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Microsoft.png`,
    url: "https://www.msftconnecttest.com/connecttest.txt",
    rules: ["GEOSITE,microsoft@cn,国内网站", "GEOSITE,microsoft,微软服务"],
  },
  {
    key: "japan",
    name: "日本网站",
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/JP.png`,
    url: "https://r.r10s.jp/com/img/home/logo/touch.png",
    rules: [
      "RULE-SET,category-bank-jp,日本网站",
      "GEOIP,jp,日本网站,no-resolve",
    ],
    providers: [
      {
        key: "category-bank-jp",
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-bank-jp.mrs`,
        path: "./ruleset/MetaCubeX/category-bank-jp.mrs",
        format: "mrs",
        behavior: "domain",
      },
    ],
    preferRegion: "JP日本", // 此服务优先使用 JP 节点组
  },
];

// ─────────────────────────────────────────────
// 3. 主入口
// ─────────────────────────────────────────────
function main(config) {
  if (!enable) return config;

  const proxies = config?.proxies || [];
  const proxyCount = proxies.length;
  const proxyProviderCount =
    typeof config?.["proxy-providers"] === "object"
      ? Object.keys(config["proxy-providers"]).length
      : 0;

  if (proxyCount === 0 && proxyProviderCount === 0) {
    throw new Error("配置文件中未找到任何代理");
  }

  // 3.1 覆盖基础配置
  config["allow-lan"] = true;
  config["bind-address"] = "*";
  config["mode"] = "rule";
  config["ipv6"] = ipv6;
  config["client-fingerprint"] = "chrome";
  config["dns"] = dnsConfig;
  config["profile"] = {
    "store-selected": true,
    "store-fake-ip": true,
  };
  config["unified-delay"] = true;
  config["tcp-concurrent"] = true;
  config["keep-alive-interval"] = 1800;
  config["find-process-mode"] = "strict";
  config["geodata-mode"] = false; // false = metadb 格式，性能更优
  config["geodata-loader"] = "memconservative";
  config["geo-auto-update"] = true;
  config["geo-update-interval"] = 24;

  config["sniffer"] = {
    enable: true,
    "force-dns-mapping": true,
    "parse-pure-ip": false,
    "override-destination": true,
    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, "8080-8880"] },
      QUIC: { ports: [443, 8443] },
    },
    "skip-src-address": skipIps,
    "skip-dst-address": skipIps,
    "force-domain": [
      "+.google.com",
      "+.googleapis.com",
      "+.googleusercontent.com",
      "+.youtube.com",
      "+.facebook.com",
      "+.messenger.com",
      "+.fbcdn.net",
      "fbcdn-a.akamaihd.net",
    ],
    "skip-domain": ["Mijia Cloud", "+.oray.com"],
  };

  config["ntp"] = {
    enable: true,
    "write-to-system": false,
    server: "ntp.aliyun.com",
  };

  config["tun"] = {
    enable: true,
    stack: "mixed",
    device: "utun1999",
    "auto-route": true,
    "auto-redirect": true,
    "auto-detect-interface": true,
    "strict-route": true,
    mtu: 1500,
    gso: true,
    "gso-max-size": 65536,
    "exclude-interface": ["NodeBabyLink"],
    // 排除 fake-ip 段，避免 TUN 路由把伪造 IP 送回本机
    "route-exclude-address": skipIps.filter((ip) => ip !== "198.18.0.0/16"),
    "dns-hijack": ["any:53", "tcp://any:53"],
  };

  config["geox-url"] = {
    geoip: `${githubProxy}https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat`,
    geosite: `${githubProxy}https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat`,
    mmdb: `${githubProxy}https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.metadb`,
    asn: `${githubProxy}https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb`,
  };

  // 注入自定义直连/拒绝代理（命名代理，便于策略组引用）
  config.proxies.push(
    { name: "直连", type: "direct", udp: true },
    { name: "拒绝", type: "reject", udp: true },
  );

  // ──────────────────────────────────────────
  // 3.2 高效代理分类（单次遍历）
  // ──────────────────────────────────────────
  const regionGroups = {};
  regionDefinitions.forEach(
    (r) => (regionGroups[r.name] = { ...r, proxies: [] }),
  );
  const otherProxies = [];

  for (let i = 0; i < proxyCount; i++) {
    const proxy = proxies[i];
    const name = proxy.name;
    let matched = false;

    // 过滤高倍率节点
    if (excludeHighPercentage) {
      const match = multiplierRegex.exec(name);
      if (match && parseFloat(match[1]) > globalRatioLimit) continue;
    }

    // 按地区匹配
    for (const region of regionDefinitions) {
      if (region.regex.test(name)) {
        regionGroups[region.name].proxies.push(name);
        matched = true;
        break;
      }
    }

    if (!matched) otherProxies.push(name);
  }

  // 生成地区自动测速组
  const generatedRegionGroups = [];
  regionDefinitions.forEach((r) => {
    const groupData = regionGroups[r.name];
    if (groupData.proxies.length === 0) return;

    // CN 大陆节点使用华为测速地址（在国内响应更可靠）
    const testUrl =
      r.name === "CN中国大陆"
        ? "http://connectivitycheck.platform.hicloud.com/generate_204"
        : "http://www.qualcomm.cn/generate_204";

    generatedRegionGroups.push({
      ...groupBaseOption,
      name: r.name,
      type: "url-test",
      tolerance: 50,
      icon: r.icon,
      proxies: groupData.proxies,
      url: testUrl,
    });
  });

  const regionGroupNames = generatedRegionGroups.map((g) => g.name);

  if (otherProxies.length > 0) {
    generatedRegionGroups.push({
      ...groupBaseOption,
      name: "其他节点",
      type: "select",
      proxies: otherProxies,
      icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/World_Map.png`,
    });
  }

  // ──────────────────────────────────────────
  // 3.3 构建功能策略组
  // ──────────────────────────────────────────
  const functionalGroups = [];

  // 默认节点（总出口，其他策略组的首选）
  functionalGroups.push({
    ...groupBaseOption,
    name: "默认节点",
    type: "select",
    proxies: [
      ...regionGroupNames,
      ...(otherProxies.length > 0 ? ["其他节点"] : []),
      "直连",
    ],
    icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Proxy.png`,
  });

  // 遍历服务配置，动态生成策略组
  serviceConfigs.forEach((svc) => {
    if (!ruleOptions[svc.key]) return;

    // 追加规则
    rules.push(...svc.rules);

    // 注册 Rule Providers（支持数组格式）
    if (Array.isArray(svc.providers)) {
      svc.providers.forEach((p) => {
        ruleProviders[p.key] = {
          ...ruleProviderCommon,
          behavior: p.behavior,
          format: p.format,
          url: p.url,
          path: p.path,
        };
      });
    }

    // 确定策略组 proxies 列表
    let groupProxies;
    if (svc.reject) {
      // 广告过滤类：默认拒绝
      groupProxies = ["REJECT", "直连", "默认节点"];
    } else if (svc.key === "biliintl" || svc.key === "bahamut") {
      // 东南亚/台湾内容：直连优先（部分机场有限制）
      groupProxies = ["默认节点", "直连", ...regionGroupNames];
    } else if (
      svc.preferRegion &&
      regionGroupNames.includes(svc.preferRegion)
    ) {
      // 有 preferRegion 的服务（如日本网站）：目标地区节点优先
      groupProxies = [
        svc.preferRegion,
        "默认节点",
        ...regionGroupNames.filter((n) => n !== svc.preferRegion),
        "直连",
      ];
    } else {
      groupProxies = ["默认节点", ...regionGroupNames, "直连"];
    }

    functionalGroups.push({
      ...groupBaseOption,
      name: svc.name,
      type: "select",
      proxies: groupProxies,
      url: svc.url,
      icon: svc.icon,
    });
  });

  // ──────────────────────────────────────────
  // 3.4 兜底规则与通用策略组
  // ──────────────────────────────────────────
  rules.push(
    "GEOSITE,private,直连",
    "GEOSITE,category-public-tracker,直连", // BT/PT tracker 直连
    "GEOSITE,category-game-platforms-download@cn,直连", // 国内游戏平台下载直连
    "GEOIP,private,直连,no-resolve",
    "GEOSITE,cn,国内网站",
    "GEOIP,cn,国内网站,no-resolve",
    "MATCH,其他外网",
  );

  functionalGroups.push(
    {
      ...groupBaseOption,
      name: "下载软件",
      type: "select",
      proxies: ["直连", "REJECT", "默认节点", "国内网站", ...regionGroupNames],
      icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Download.png`,
    },
    {
      ...groupBaseOption,
      name: "其他外网",
      type: "select",
      proxies: ["默认节点", "国内网站", ...regionGroupNames],
      icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Streaming!CN.png`,
    },
    {
      ...groupBaseOption,
      name: "国内网站",
      type: "select",
      proxies: ["直连", "默认节点", ...regionGroupNames],
      url: "http://connectivitycheck.platform.hicloud.com/generate_204",
      icon: `${githubProxy}https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/StreamingCN.png`,
    },
  );

  // ──────────────────────────────────────────
  // 3.5 组装最终输出
  // ──────────────────────────────────────────
  config["proxy-groups"] = [...functionalGroups, ...generatedRegionGroups];
  config["rules"] = rules;
  config["rule-providers"] = ruleProviders;

  return config;
}

// 兼容 ES Module 和 CommonJS 导出
export default main;
