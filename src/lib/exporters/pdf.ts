import { saveAs } from 'file-saver';

/**
 * PDF 导出 — 用浏览器打开一个新窗口装载 HTML,触发"打印为 PDF"。
 *
 * 为什么不用 jsPDF:jsPDF 默认字体不支持 CJK / 阿拉伯 / 泰文,
 * 加载完整字体文件会让包大上 MB 级。
 *
 * 用浏览器原生打印,任何 Unicode 都能渲染,且尊重系统字体。
 * 用户在打印对话框选"另存为 PDF"即可。
 */
export async function exportPdf(text: string, filename: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) {
    alert('浏览器拦截了弹窗。请允许此站点弹窗后重试,或使用 Word 格式下载。');
    return;
  }

  const safeName = filename.replace(/\.pdf$/i, '');
  const escaped = escapeHtml(text);

  w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(safeName)}</title>
<style>
  @page { size: A4; margin: 24mm 20mm; }
  html, body { margin: 0; padding: 0; }
  body {
    font: 14px/1.7 -apple-system, BlinkMacSystemFont, "SF Pro Text",
          "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
          "Noto Sans", "Noto Sans Arabic", "Noto Sans Thai", sans-serif;
    color: #1d1d1f;
    padding: 24px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  h1 { font-size: 18px; font-weight: 600; margin: 0 0 16px; color: #34C759; }
  .meta { font-size: 11px; color: #86868b; margin-bottom: 20px; }
  .content { font-size: 14px; }
  @media print {
    .no-print { display: none !important; }
  }
  .no-print {
    position: fixed; top: 16px; right: 16px;
    background: #34C759; color: white; border: none;
    padding: 10px 18px; border-radius: 12px; font-size: 14px;
    font-weight: 600; cursor: pointer; z-index: 9999;
    box-shadow: 0 4px 12px rgba(52,199,89,0.3);
  }
</style>
</head>
<body>
  <button class="no-print" onclick="window.print()">打印 / 保存为 PDF</button>
  <h1>${escapeHtml(safeName)}</h1>
  <div class="meta">ROOT LINGO · ${new Date().toLocaleString('zh-CN')}</div>
  <div class="content">${escaped}</div>
  <script>
    // 等字体加载完成,自动触发打印对话框
    setTimeout(() => window.print(), 600);
  </script>
</body>
</html>`);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
