/***
 * Clash Verge Rev / Mihomo Party 优化脚本
 * 原作者: dahaha-365 (YaNet)
 * Github：https://github.com/dahaha-365/YaNet
 */

// --- 1. 静态配置区域 ---

/**
 * 整个脚本的总开关，在Mihomo Party使用的话，请保持为true
 * true = 启用
 * false = 禁用
 */
const enable = true;

/**
 * 分流规则配置，会自动生成对应的策略组
 * 设置的时候可遵循“最小，可用”原则，把自己不需要的规则全禁用掉，提高效率
 * true = 启用
 * false = 禁用
 */
const ruleOptions = {
  apple: true, // 苹果服务
  microsoft: true, // 微软服务
  github: true, // Github服务
  google: true, // Google服务
  openai: true, // 国外AI和GPT
  spotify: true, // Spotify
  youtube: true, // YouTube
  bahamut: true, // 巴哈姆特/动画疯
  netflix: true, // Netflix网飞
  tiktok: true, // 国际版抖音
  disney: true, // 迪士尼
  pixiv: true, // Pixiv
  hbo: true, // HBO
  "media-cn@!cn": true, // 港澳台媒体
  biliintl: false, // 哔哩哔哩东南亚
  tvb: true, // TVB
  hulu: true, // Hulu
  primevideo: true, // 亚马逊prime video
  telegram: true, // Telegram通讯软件
  line: true, // Line通讯软件
  whatsapp: true, // Whatsapp
  games: true, // 游戏策略组
  japan: true, // 日本网站策略组
  // tracker: true, // 网络分析和跟踪服务
  ads: true, // 常见的网络广告
};

const skipIps = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "169.254.0.0/16",
  "127.0.0.0/8",
  "FC00::/7",
  "FE80::/10",
  "::1/128",
];

// 初始规则
const rules = [
  "RULE-SET,applications,下载软件",
  "PROCESS-NAME,SunloginClient,DIRECT",
  "PROCESS-NAME,SunloginClient.exe,DIRECT",
  "PROCESS-NAME,AnyDesk,DIRECT",
  "PROCESS-NAME,AnyDesk.exe,DIRECT",
  "PROCESS-NAME,节点小宝,DIRECT",
  "PROCESS-NAME,nblink.exe,DIRECT",
  "PROCESS-NAME,NodeBabyLinkBackup,DIRECT",
  "PROCESS-NAME,NodeBabyLinkClient,DIRECT",
  "PROCESS-NAME,NodeBabyLinkRfile,DIRECT",
  "PROCESS-NAME,NodeBabyLinkBackup.exe,DIRECT",
  "PROCESS-NAME,NodeBabyLinkClient.exe,DIRECT",
  "PROCESS-NAME,NodeBabyLinkDevice.exe,DIRECT",
  "PROCESS-NAME,NodeBabyLinkOwjdxb.exe,DIRECT",
  "PROCESS-NAME,NodeBabyLinkRfile.exe,DIRECT",
  "PROCESS-NAME,NodeBabyLinkService.exe,DIRECT",
  "DOMAIN-SUFFIX,iepose.com,DIRECT",
  "DOMAIN-SUFFIX,ionewu.com,DIRECT",
];

// 地区定义 (Icons 更新为 GitHub Raw)
const regionDefinitions = [
  {
    name: "SG新加坡",
    regex: /新加坡|🇸🇬|sg|singapore/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Singapore.png",
  },
  {
    name: "TW台湾省",
    regex: /台湾|🇹🇼|tw|taiwan|tai wan/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/China.png",
  },
  {
    name: "JP日本",
    regex: /日本|🇯🇵|jp|japan/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png",
  },
  {
    name: "KR韩国",
    regex: /韩|🇰🇷|kr|korea/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Korea.png",
  },
  {
    name: "US美国",
    regex: /(?!.*aus)(?=.*(美|🇺🇸|us(?!t)|usa|american|united states)).*/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png",
  },
  {
    name: "HK香港",
    regex: /港|🇭🇰|hk|hongkong|hong kong/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hong_Kong.png",
  },
  {
    name: "GB英国",
    regex: /英|🇬🇧|uk|united kingdom|great britain/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_Kingdom.png",
  },
  {
    name: "DE德国",
    regex: /德国|🇩🇪|de|germany/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Germany.png",
  },
  {
    name: "MY马来西亚",
    regex: /马来|🇲🇾|my|malaysia/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Malaysia.png",
  },
  {
    name: "TK土耳其",
    regex: /土耳其|🇹🇷|tk|turkey/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Turkey.png",
  },
  {
    name: "CA加拿大",
    regex: /加拿大|🇨🇦|ca|canada/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Canada.png",
  },
  {
    name: "AU澳大利亚",
    regex: /澳大利亚|🇦🇺|au|australia|sydney/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Australia.png",
  },
  {
    name: "CN中国大陆",
    regex: /中国|🇨🇳|cn|china|shanghai|beijing/i,
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/China_Map.png",
  },
];
const excludeHighPercentage = true;
const globalRatioLimit = 2;

// DNS 配置
const chinaDNS = [
  "https://223.5.5.5/dns-query", // 阿里DOH
  "https://120.53.53.53/dns-query", // 腾讯DoH
  "https://doh.360.cn/dns-query", // 360安全DoH
];

const foreignDNS = [
  "https://1.1.1.1/dns-query", // Cloudflare
  "https://8.8.8.8/dns-query", // Google DoH
  "https://1.0.0.1/dns-query", // Cloudflare 备用节点
  "https://8.8.4.4/dns-query", // Google 备用
  "https://208.67.222.222/dns-query", // OpenDNS 有过滤，作为末级 fallback
];
const dnsConfig = {
  enable: true,
  listen: "0.0.0.0:1053",
  ipv6: true,
  "prefer-h3": true,
  "use-hosts": true,
  "use-system-hosts": true,
  "respect-rules": true,
  "enhanced-mode": "fake-ip",
  "fake-ip-range": "198.18.0.1/16",
  "fake-ip-filter-mode": "whitelist",
  "fake-ip-filter": [
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
    "geosite:category-bank-cn@!cn",
  ],
  nameserver: foreignDNS,
  fallback: chinaDNS,
  "fallback-filter": {
    geoip: true,
  },
  "proxy-server-nameserver": foreignDNS,
  "nameserver-policy": {
    "geosite:private": "system",
    "geosite:tld-cn,cn,steam@cn,category-games@cn,microsoft@cn,apple@cn":
      chinaDNS,
  },
};

// 通用配置
const ruleProviderCommon = {
  type: "http",
  format: "yaml",
  interval: 86400,
};
const groupBaseOption = {
  interval: 300,
  timeout: 3000,
  url: "http://www.gstatic.com/generate_204",
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
    url: "https://github.com/DustinWin/ruleset_geodata/raw/refs/heads/mihomo-ruleset/applications.list",
    path: "./ruleset/DustinWin/applications.list",
  },
};

// 倍率正则预编译
const multiplierRegex =
  /(?<=[xX✕✖⨉倍率])([1-9]+(\.\d+)*|0{1}\.\d+)(?=[xX✕✖⨉倍率])*/i;

// --- 2. 服务规则数据结构 ---
// Icons 更新为 GitHub Raw
const serviceConfigs = [
  {
    key: "openai",
    name: "国外AI",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/ChatGPT.png",
    url: "https://chat.openai.com/cdn-cgi/trace",
    rules: [
      "GEOSITE,jetbrains-ai,国外AI",
      "GEOSITE,category-ai-!cn,国外AI",
      "GEOSITE,category-ai-chat-!cn,国外AI",
      "DOMAIN-SUFFIX,meta.ai,国外AI",
      "DOMAIN-SUFFIX,meta.com,国外AI",
    ],
  },
  {
    key: "youtube",
    name: "YouTube",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/YouTube.png",
    url: "https://www.youtube.com/s/desktop/494dd881/img/favicon.ico",
    rules: ["GEOSITE,youtube,YouTube"],
  },
  {
    key: "media-cn@!cn",
    name: "港澳台媒体",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/TVB.png",
    url: "https://viu.tv/",
    rules: [
      "GEOSITE,tvb,港澳台媒体",
      "GEOSITE,hkt,港澳台媒体",
      "GEOSITE,hkt,港澳台媒体",
      "GEOSITE,hkopentv,港澳台媒体",
      "GEOSITE,hkopentv,港澳台媒体",
      "RULE-SET,hk-media,港澳台媒体",
    ],
    provider: {
      key: "hk-media",
      url: "https://ruleset.skk.moe/List/non_ip/stream_hk.conf",
      path: "./ruleset/hk-media/hk-media.mrs",
      format: "text",
      behavior: "classical",
    },
  },
  {
    key: "biliintl",
    name: "哔哩哔哩东南亚",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/bilibili_3.png",
    url: "https://www.bilibili.tv/",
    rules: ["GEOSITE,biliintl,哔哩哔哩东南亚"],
  },
  {
    key: "bahamut",
    name: "巴哈姆特",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Bahamut.png",
    url: "https://ani.gamer.com.tw/ajax/getdeviceid.php",
    rules: ["GEOSITE,bahamut,巴哈姆特"],
  },
  {
    key: "disney",
    name: "Disney+",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Disney+.png",
    url: "https://disney.api.edge.bamgrid.com/devices",
    rules: ["GEOSITE,disney,Disney+"],
  },
  {
    key: "netflix",
    name: "NETFLIX",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Netflix.png",
    url: "https://api.fast.com/netflix/speedtest/v2?https=true",
    rules: ["GEOSITE,netflix,NETFLIX"],
  },
  {
    key: "tiktok",
    name: "Tiktok",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/TikTok.png",
    url: "https://www.tiktok.com/",
    rules: ["GEOSITE,tiktok,Tiktok"],
  },
  {
    key: "spotify",
    name: "Spotify",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Spotify.png",
    url: "http://spclient.wg.spotify.com/signup/public/v1/account",
    rules: ["GEOSITE,spotify,Spotify"],
  },
  {
    key: "pixiv",
    name: "Pixiv",
    icon: "https://play-lh.googleusercontent.com/8pFuLOHF62ADcN0ISUAyEueA5G8IF49mX_6Az6pQNtokNVHxIVbS1L2NM62H-k02rLM=w240-h480-rw",
    url: "http://spclient.wg.spotify.com/signup/public/v1/account",
    rules: ["GEOSITE,pixiv,Pixiv"],
  },
  {
    key: "hbo",
    name: "HBO",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/HBO.png",
    url: "https://www.hbo.com/favicon.ico",
    rules: ["GEOSITE,hbo,HBO"],
  },
  {
    key: "tvb",
    name: "TVB",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/TVB.png",
    url: "https://www.tvb.com/logo_b.svg",
    rules: ["GEOSITE,tvb,TVB"],
  },
  {
    key: "primevideo",
    name: "Prime Video",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Prime_Video.png",
    url: "https://m.media-amazon.com/images/G/01/digital/video/web/logo-min-remaster.png",
    rules: ["GEOSITE,primevideo,Prime Video"],
  },
  {
    key: "hulu",
    name: "Hulu",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hulu.png",
    url: "https://auth.hulu.com/v4/web/password/authenticate",
    rules: ["GEOSITE,hulu,Hulu"],
  },
  {
    key: "telegram",
    name: "Telegram",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Telegram.png",
    url: "http://www.telegram.org/img/website_icon.svg",
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
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Line.png",
    url: "https://line.me/page-data/app-data.json",
    rules: ["GEOSITE,line,Line"],
  },
  {
    key: "games",
    name: "游戏专用",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Game.png",
    rules: [
      "GEOSITE,category-games@cn,国内网站",
      "GEOSITE,category-games,游戏专用",
    ],
  },
  {
    key: "ads",
    name: "广告过滤",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Advertising.png",
    rules: [
      "GEOSITE,category-ads-all,广告过滤",
      "RULE-SET,adblockmihomo,广告过滤",
    ],
    provider: {
      key: "adblockmihomo",
      url: "https://github.com/217heidai/adblockfilters/raw/refs/heads/main/rules/adblockmihomo.mrs",
      path: "./ruleset/adblockfilters/adblockmihomo.mrs",
      format: "mrs",
      behavior: "domain",
    },
    reject: true,
  },
  {
    key: "apple",
    name: "苹果服务",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Apple_2.png",
    url: "http://www.apple.com/library/test/success.html",
    rules: ["GEOSITE,apple-cn,苹果服务"],
  },
  {
    key: "google",
    name: "谷歌服务",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Google_Search.png",
    url: "http://www.gstatic.com/generate_204",
    rules: ["GEOSITE,google,谷歌服务"],
  },
  {
    key: "github",
    name: "Github",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/GitHub.png",
    url: "https://github.com/robots.txt",
    rules: ["GEOSITE,github,Github"],
  },
  {
    key: "microsoft",
    name: "微软服务",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Microsoft.png",
    url: "http://www.msftconnecttest.com/connecttest.txt",
    rules: ["GEOSITE,microsoft@cn,国内网站", "GEOSITE,microsoft,微软服务"],
  },
  {
    key: "japan",
    name: "日本网站",
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/JP.png",
    url: "https://r.r10s.jp/com/img/home/logo/touch.png",
    rules: [
      "RULE-SET,category-bank-jp,日本网站",
      "GEOIP,jp,日本网站,no-resolve",
    ],
    provider: {
      key: "category-bank-jp",
      url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-bank-jp.mrs",
      path: "./ruleset/MetaCubeX/category-bank-jp.mrs",
      format: "mrs",
      behavior: "domain",
    },
  },
];

// --- 3. 主入口 ---
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
  config["dns"] = dnsConfig;
  config["profile"] = {
    "store-selected": true,
    "store-fake-ip": true,
  };
  config["unified-delay"] = true;
  config["tcp-concurrent"] = true;
  config["keep-alive-interval"] = 1800;
  config["find-process-mode"] = "strict";
  config["geodata-mode"] = true;
  config["geodata-loader"] = "memconservative";
  config["geo-auto-update"] = true;
  config["geo-update-interval"] = 24;

  config["sniffer"] = {
    enable: true,
    "force-dns-mapping": true,
    "parse-pure-ip": false,
    "override-destination": true,
    sniff: {
      TLS: {
        ports: [443, 8443],
      },
      HTTP: {
        ports: [80, "8080-8880"],
      },
      QUIC: {
        ports: [443, 8443],
      },
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
    server: "cn.ntp.org.cn",
  };
  config["tun"] = {
    stack: "mixed",
    "exclude-interface": ["NodeBabyLink"],
    "route-exclude-address": skipIps,
  };
  config["geox-url"] = {
    geoip:
      "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat",
    geosite:
      "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat",
    mmdb: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/country-lite.mmdb",
    asn: "https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb",
  };

  config.proxies.push({
    name: "直连",
    type: "direct",
    udp: true,
  });

  // 3.2 高效代理分类 (单次遍历)
  const regionGroups = {};
  regionDefinitions.forEach(
    (r) =>
      (regionGroups[r.name] = {
        ...r,
        proxies: [],
      })
  );
  const otherProxies = [];

  for (let i = 0; i < proxyCount; i++) {
    const proxy = proxies[i];
    const name = proxy.name;
    let matched = false;

    // 检查倍率
    if (excludeHighPercentage) {
      const match = multiplierRegex.exec(name);
      if (match && parseFloat(match[1]) > globalRatioLimit) {
        continue;
      }
    }

    // 尝试匹配地区
    for (const region of regionDefinitions) {
      if (region.regex.test(name)) {
        regionGroups[region.name].proxies.push(name);
        matched = true;
        break;
      }
    }

    if (!matched) {
      otherProxies.push(name);
    }
  }

  const generatedRegionGroups = [];
  regionDefinitions.forEach((r) => {
    const groupData = regionGroups[r.name];
    if (groupData.proxies.length > 0) {
      // 根据地区选择测速 URL
      let testUrl = "http://www.gstatic.com/generate_204"; // 默认 Google
      if (r.name === "CN中国大陆") {
        testUrl = "http://connectivitycheck.platform.hicloud.com/generate_204"; // 华为
      }

      generatedRegionGroups.push({
        ...groupBaseOption,
        name: r.name,
        type: "url-test",
        tolerance: 50,
        icon: r.icon,
        proxies: groupData.proxies,
        url: testUrl,
      });
    }
  });

  const regionGroupNames = generatedRegionGroups.map((g) => g.name);

  if (otherProxies.length > 0) {
    generatedRegionGroups.push({
      ...groupBaseOption,
      name: "其他节点",
      type: "select",
      proxies: otherProxies,
      icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/World_Map.png",
    });
  }

  // 3.3 构建功能策略组
  const functionalGroups = [];

  functionalGroups.push({
    ...groupBaseOption,
    name: "默认节点",
    type: "select",
    proxies: [...regionGroupNames, "其他节点", "直连"].filter(
      (n) => n !== "其他节点" || otherProxies.length > 0
    ),
    icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Proxy.png",
  });

  serviceConfigs.forEach((svc) => {
    if (ruleOptions[svc.key]) {
      rules.push(...svc.rules);
      if (svc.provider) {
        ruleProviders[svc.provider.key] = {
          ...ruleProviderCommon,
          behavior: svc.provider.behavior,
          format: svc.provider.format,
          url: svc.provider.url,
          path: svc.provider.path,
        };
      }

      let groupProxies;
      if (svc.reject) {
        groupProxies = ["REJECT", "直连", "默认节点"];
      } else if (svc.key === "biliintl" || svc.key === "bahamut") {
        groupProxies = ["默认节点", "直连", ...regionGroupNames];
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
    }
  });

  // 3.4 添加通用兜底策略组
  rules.push(
    "GEOSITE,private,DIRECT",
    "GEOIP,private,DIRECT,no-resolve",
    "GEOSITE,cn,国内网站",
    "GEOIP,cn,国内网站,no-resolve",
    "MATCH,其他外网"
  );

  functionalGroups.push(
    {
      ...groupBaseOption,
      name: "下载软件",
      type: "select",
      proxies: ["直连", "REJECT", "默认节点", "国内网站", ...regionGroupNames],
      icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Download.png",
    },
    {
      ...groupBaseOption,
      name: "其他外网",
      type: "select",
      proxies: ["默认节点", "国内网站", ...regionGroupNames],
      icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Streaming!CN.png",
    },
    {
      ...groupBaseOption,
      name: "国内网站",
      type: "select",
      proxies: ["直连", "默认节点", ...regionGroupNames],
      url: "http://connectivitycheck.platform.hicloud.com/generate_204",
      icon: "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/StreamingCN.png",
    }
  );

  // 3.5 组装最终结果
  config["proxy-groups"] = [...functionalGroups, ...generatedRegionGroups];

  config["rules"] = rules;
  config["rule-providers"] = ruleProviders;

  return config;
}

// 导出 main 函数供 Node.js 使用（ES6 模块语法）
export default main;
