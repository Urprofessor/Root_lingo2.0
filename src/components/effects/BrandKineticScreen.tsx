'use client';

import KineticTextGrid from './KineticTextGrid';
import { ROOT_LINGO_LANGS } from './brandLangs';

/**
 * 全屏品牌动效 —— 深色底 + 多语言 "ROOT LINGO" 动态网格,收束到中心的
 * 拉丁品牌本名。用作全遮罩 loading 与登录转场的统一视觉。
 *
 * 填满父容器(需由外层提供尺寸,如 fixed inset-0)。
 */
export function BrandKineticScreen() {
  return (
    <div
      className="h-full w-full overflow-hidden"
      style={{ backgroundColor: '#1d1d1f' }}
    >
      <KineticTextGrid
        text="ROOT LINGO"
        texts={ROOT_LINGO_LANGS}
        backgroundColor="#1d1d1f"
        textColor="#ffffff"
        rowCount={5}
        repeatCount={5}
        expandDurationSec={0.9}
        holdDurationSec={0.8}
        font={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(22px, 5vw, 54px)',
          lineHeight: '1.5em',
          letterSpacing: '-0.02em',
          textAlign: 'left',
        }}
      />
    </div>
  );
}
