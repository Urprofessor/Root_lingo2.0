/**
 * 提示词模板 - 元数据 + 内容
 */
export interface PromptTemplate {
  /** 唯一 id,从 frontmatter 读 */
  id: string;
  /** 显示名 */
  name: string;
  /** 描述 */
  description?: string;
  /** 类别 - medical / business / legal / technical / writing / general */
  category?: string;
  /** 适用的源语言(如果声明,则只在该源语言时显示) */
  sourceLang?: string;
  /** 适用的目标语言(如果声明,则只在目标语言匹配时显示) */
  targetLangs?: string[];
  /** 标签 */
  tags?: string[];
  /** 实际 prompt 内容(frontmatter 后面的正文) */
  content: string;
  /** 是否是内置模板(从 .md 文件打包来的) */
  isBuiltin: boolean;
}
