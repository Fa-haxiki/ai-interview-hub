/**
 * 站点分类体系：一级分类（category）→ 二级主题（topic）→ 主题内小节（section）。
 * 题目文件放在 content/questions/<category>/<topic>/<slug>.md，
 * frontmatter 中的 category / topic / section 必须能在这里找到，否则构建失败。
 */

export type CategoryId = "frontend" | "backend" | "ai";

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
    description: "大模型应用与工程：RAG、Agent、模型基础与评估。",
    topics: [
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
        id: "agent",
        name: "Agent 与工具调用",
        description: "规划、工具调用、记忆、多 Agent 协作与可靠性。",
        sections: ["基础概念", "规划与工具调用", "记忆与状态", "评估与可靠性"],
      },
      {
        id: "llm-basics",
        name: "大模型基础",
        description: "Transformer、注意力、推理优化、上下文窗口等基础知识。",
        sections: ["模型结构", "训练与推理", "上下文与长文本"],
      },
      {
        id: "prompt",
        name: "Prompt 工程",
        description: "提示词设计、结构化输出、少样本与思维链。",
        sections: ["基础技巧", "结构化输出", "评估与迭代"],
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
