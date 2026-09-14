/**
 * 站点分类体系：一级分类（category）→ 二级主题（topic）→ 主题内小节（section）。
 * 题目文件放在 content/questions/<category>/<topic>/<slug>.md，
 * frontmatter 中的 category / topic / section 必须能在这里找到，否则构建失败。
 */

export type CategoryId = "frontend" | "backend" | "ai" | "bigtech";

export interface TopicDef {
  /** URL 与目录名 */
  id: string;
  name: string;
  description: string;
  /** 主题内小节的展示顺序，题目 frontmatter 的 section 必须是其中之一 */
  sections: string[];
}

export interface CategoryDef {
  id: CategoryId;
  name: string;
  description: string;
  topics: TopicDef[];
}

export const taxonomy: CategoryDef[] = [
  {
    id: "ai",
    name: "AI",
    description:
      "大模型应用与工程：模型基础、Prompt、RAG、Agent、微调、推理服务、多模态与安全。",
    topics: [
      {
        id: "llm-basics",
        name: "大模型基础",
        description:
          "Transformer、注意力、KV Cache、MoE、推理阶段与长上下文。",
        sections: ["模型结构", "训练与推理", "上下文与长文本"],
      },
      {
        id: "prompt",
        name: "Prompt 与上下文工程",
        description:
          "角色与消息、少样本、思维链、结构化输出，以及怎么迭代评测提示词。",
        sections: ["基础技巧", "推理与示范", "结构化输出", "评估与迭代"],
      },
      {
        id: "rag",
        name: "RAG 与知识库",
        description:
          "检索增强生成的完整链路：文档处理、检索、重排、生成、评估与生产化。",
        sections: [
          "基础概念",
          "文档处理与分块",
          "Embedding 与向量检索",
          "混合检索与重排",
          "查询理解与改写",
          "生成与上下文组织",
          "幻觉与质量",
          "评估",
          "高级 RAG",
          "生产工程与系统设计",
        ],
      },
      {
        id: "frameworks",
        name: "LangChain 与 LangGraph",
        description:
          "编排框架的核心抽象、图工作流、检查点与生产落地取舍。",
        sections: ["LangChain 核心", "LangGraph", "生产实践"],
      },
      {
        id: "embedding",
        name: "Embedding",
        description:
          "向量表示的训练原理、评测榜单、指令前缀、量化与领域微调。",
        sections: ["原理与训练", "选型与评测", "工程实践"],
      },
      {
        id: "search-infra",
        name: "检索基建",
        description:
          "Elasticsearch 倒排检索与 Milvus 向量库的原理、参数与 RAG 落地。",
        sections: ["Elasticsearch", "Milvus", "选型对比"],
      },
      {
        id: "knowledge-graph",
        name: "知识图谱与 Neo4j",
        description:
          "属性图模型、Cypher、图谱构建，以及图检索与 RAG 的结合。",
        sections: ["图基础", "Neo4j", "GraphRAG 工程"],
      },
      {
        id: "agent",
        name: "Agent 与工具调用",
        description:
          "规划、原生 function calling、记忆、MCP、多 Agent 与可靠性护栏。",
        sections: ["基础概念", "规划与工具调用", "记忆与协议", "评估与可靠性"],
      },
      {
        id: "finetune",
        name: "微调与对齐",
        description:
          "SFT、LoRA、偏好对齐，以及微调相对 RAG / Prompt 的适用边界。",
        sections: ["方法选型", "参数高效微调", "对齐"],
      },
      {
        id: "serving",
        name: "推理服务与部署",
        description:
          "Prefill/Decode、PagedAttention、连续批处理、量化与延迟指标。",
        sections: ["推理原理", "服务化", "成本与性能"],
      },
      {
        id: "multimodal",
        name: "多模态",
        description:
          "视觉语言模型、文档理解，以及图文 Embedding 怎么进检索。",
        sections: ["视觉语言模型", "文档理解", "多模态检索"],
      },
      {
        id: "safety",
        name: "安全与红队",
        description:
          "提示注入、间接注入、工具越权、输出护栏与数据泄漏。",
        sections: ["提示注入", "工具与数据", "护栏"],
      },
    ],
  },
  {
    id: "frontend",
    name: "前端",
    description: "JavaScript、CSS、框架、工程化与性能优化。",
    topics: [
      {
        id: "javascript",
        name: "JavaScript",
        description: "语言核心、异步、原型与运行机制。",
        sections: ["语言基础", "异步与事件循环", "原型与作用域"],
      },
      {
        id: "css",
        name: "CSS",
        description: "布局、层叠、动画与响应式。",
        sections: ["布局", "层叠与选择器", "响应式与动画"],
      },
      {
        id: "react",
        name: "React",
        description: "渲染机制、Hooks、状态管理与性能。",
        sections: ["渲染机制", "Hooks", "状态管理与性能"],
      },
      {
        id: "engineering",
        name: "工程化与性能",
        description: "构建工具、模块化、性能指标与优化手段。",
        sections: ["构建与模块化", "性能优化", "浏览器与网络"],
      },
    ],
  },
  {
    id: "backend",
    name: "后端",
    description: "语言基础、数据库、缓存消息队列与分布式系统。",
    topics: [
      {
        id: "language",
        name: "语言基础",
        description: "Java / Go / Node.js 等后端语言的核心机制。",
        sections: ["并发模型", "内存与 GC", "运行时"],
      },
      {
        id: "database",
        name: "数据库",
        description: "索引、事务、锁与 SQL 优化。",
        sections: ["索引与存储", "事务与锁", "SQL 优化"],
      },
      {
        id: "cache-mq",
        name: "缓存与消息队列",
        description: "Redis、Kafka 等中间件的原理与实践。",
        sections: ["缓存", "消息队列"],
      },
      {
        id: "distributed",
        name: "分布式与系统设计",
        description: "一致性、高可用、限流降级与架构设计题。",
        sections: ["一致性与协调", "高可用", "系统设计"],
      },
    ],
  },
  {
    id: "bigtech",
    name: "大厂面试题",
    description: "按文档标题收录的大厂面经，一份文档一页，点击题目展开参考答案。",
    topics: [
      {
        id: "packs",
        name: "面经",
        description: "内部主题，分类页按文档标题平铺，不单独展示。",
        sections: ["2026", "2025", "2024", "其他"],
      },
    ],
  },
];

export function getCategoryDef(id: string): CategoryDef | undefined {
  return taxonomy.find((c) => c.id === id);
}

export function getTopicDef(
  categoryId: string,
  topicId: string,
): TopicDef | undefined {
  return getCategoryDef(categoryId)?.topics.find((t) => t.id === topicId);
}

export const categoryIds = taxonomy.map((c) => c.id) as [
  CategoryId,
  ...CategoryId[],
];
