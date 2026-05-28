// 主工作区的视图切换类型 - 独立成文件以避免循环依赖
export type ActiveView =
  | 'workspace'
  | 'tips'
  | 'excel'
  | 'glossary'
  | 'templates'
  | 'api-keys'
  | 'settings';
