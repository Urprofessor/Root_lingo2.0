'use client';

import { ChevronDown, ChevronUp, Check, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { colIndexToLetter, cellDisplay } from '@/lib/excel/parse';
import type { ExcelSheetData, SheetConfig } from '@/types/excel';

const PREVIEW_ROWS = 10;
const PREVIEW_COLS_MAX = 12;
const CELL_PREVIEW_CHARS = 30;

interface Props {
  sheet: ExcelSheetData;
  config: SheetConfig;
  index: number;
  onToggleInclude: () => void;
  onSelectionModeChange: (mode: 'columns' | 'rows') => void;
  onToggleColumn: (col: number) => void;
  onToggleRow: (row: number) => void;
  onSkipHeaderChange: (skip: boolean) => void;
  onOutputModeChange: (mode: 'full-copy' | 'selected-only') => void;
}

export function SheetConfigCard({
  sheet,
  config,
  index,
  onToggleInclude,
  onSelectionModeChange,
  onToggleColumn,
  onToggleRow,
  onSkipHeaderChange,
  onOutputModeChange,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const previewColCount = Math.min(sheet.colCount, PREVIEW_COLS_MAX);
  const previewRowCount = Math.min(sheet.rowCount, PREVIEW_ROWS);
  const hasMoreCols = sheet.colCount > PREVIEW_COLS_MAX;
  const hasMoreRows = sheet.rowCount > PREVIEW_ROWS;

  const selectedColsCount = config.selectedColumns.length;
  const selectedRowsCount = config.selectedRows.length;
  const isCols = config.selectionMode === 'columns';

  return (
    <div
      className={cn(
        'rounded-3xl border bg-white shadow-apple-sm transition',
        config.include ? 'border-ink-200' : 'border-ink-200 opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-100 text-[10px] font-bold text-ink-600">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{sheet.name}</p>
            <p className="text-[11px] text-ink-500">
              {sheet.rowCount} 行 × {sheet.colCount} 列
              {config.include && isCols && selectedColsCount > 0 && (
                <span className="ml-2 text-brand-600">· 选中 {selectedColsCount} 列</span>
              )}
              {config.include && !isCols && selectedRowsCount > 0 && (
                <span className="ml-2 text-brand-600">· 选中 {selectedRowsCount} 行</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onToggleInclude}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition',
              config.include
                ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
            )}
            title={config.include ? '点击跳过此 Sheet' : '点击加入翻译'}
          >
            {config.include ? <Eye size={12} /> : <EyeOff size={12} />}
            {config.include ? '翻译' : '跳过'}
          </button>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-xl p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-700"
            aria-label={collapsed ? '展开' : '收起'}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && config.include && (
        <div className="space-y-4 p-5">
          {/* 选择模式 */}
          <div>
            <p className="mb-2 text-[11px] font-medium text-ink-500">选择模式</p>
            <div className="flex gap-2">
              <ModeBtn
                active={isCols}
                onClick={() => onSelectionModeChange('columns')}
                label="按列翻译"
                hint="选定某几列,把这些列所有单元格翻译"
              />
              <ModeBtn
                active={!isCols}
                onClick={() => onSelectionModeChange('rows')}
                label="按行翻译"
                hint="选定某几行,把这些行所有单元格翻译"
              />
            </div>
          </div>

          {/* 表头跳过开关(仅列模式) */}
          {isCols && (
            <div className="flex items-center justify-between rounded-2xl border border-ink-200 bg-ink-50/40 px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-ink-800">首行是表头,跳过不翻</p>
                <p className="text-[11px] text-ink-500">勾上后第 1 行原样保留</p>
              </div>
              <Toggle
                checked={config.skipHeaderRow}
                onChange={onSkipHeaderChange}
                small
              />
            </div>
          )}

          {/* 输出模式 */}
          <div>
            <p className="mb-2 text-[11px] font-medium text-ink-500">输出形式</p>
            <div className="flex gap-2">
              <ModeBtn
                active={config.outputMode === 'full-copy'}
                onClick={() => onOutputModeChange('full-copy')}
                label="完整复制"
                hint="保留所有列/行,只替换选中部分"
              />
              <ModeBtn
                active={config.outputMode === 'selected-only'}
                onClick={() => onOutputModeChange('selected-only')}
                label="只保留选中"
                hint="只输出选中的列/行,其他丢掉"
              />
            </div>
          </div>

          {/* 预览 + 列/行选择 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-medium text-ink-500">
                数据预览(点列头/行号选中)
              </p>
              {(hasMoreCols || hasMoreRows) && (
                <p className="text-[10px] text-ink-400">
                  仅展示前 {previewRowCount} 行 × {previewColCount} 列
                </p>
              )}
            </div>
            <div className="overflow-x-auto rounded-2xl border border-ink-200">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-ink-50/70">
                    <th className="sticky left-0 z-10 w-10 border-b border-r border-ink-200 bg-ink-50/70 px-1 py-1.5 text-center text-[10px] font-medium text-ink-400">
                      #
                    </th>
                    {Array.from({ length: previewColCount }).map((_, c) => {
                      const selected = isCols && config.selectedColumns.includes(c);
                      const disabled = !isCols;
                      return (
                        <th
                          key={c}
                          onClick={() => !disabled && onToggleColumn(c)}
                          className={cn(
                            'border-b border-r border-ink-200 px-2 py-1.5 text-center text-[10px] font-semibold transition',
                            disabled
                              ? 'cursor-default text-ink-400'
                              : 'cursor-pointer hover:bg-ink-100',
                            selected && 'bg-brand-100 text-brand-800'
                          )}
                          title={
                            disabled
                              ? '当前为行模式,切到列模式才能选列'
                              : selected
                                ? '点击取消选中'
                                : '点击选中此列'
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            {selected && <Check size={9} />}
                            {colIndexToLetter(c)}
                          </span>
                        </th>
                      );
                    })}
                    {hasMoreCols && (
                      <th className="border-b border-ink-200 px-2 py-1.5 text-center text-[10px] text-ink-400">
                        …
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: previewRowCount }).map((_, r) => {
                    const rowSelected = !isCols && config.selectedRows.includes(r);
                    const rowDisabled = isCols;
                    const isHeader = isCols && config.skipHeaderRow && r === 0;
                    return (
                      <tr
                        key={r}
                        className={cn(
                          isHeader && 'bg-ink-50/60',
                          rowSelected && 'bg-brand-50/40'
                        )}
                      >
                        <td
                          onClick={() => !rowDisabled && onToggleRow(r)}
                          className={cn(
                            'sticky left-0 z-10 border-r border-ink-200 px-1 py-1 text-center text-[10px] font-medium transition',
                            rowDisabled
                              ? 'cursor-default bg-ink-50/70 text-ink-400'
                              : 'cursor-pointer bg-ink-50/70 hover:bg-ink-100',
                            rowSelected && 'bg-brand-100 text-brand-800'
                          )}
                          title={
                            rowDisabled
                              ? '当前为列模式,切到行模式才能选行'
                              : rowSelected
                                ? '点击取消选中'
                                : '点击选中此行'
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            {rowSelected && <Check size={9} />}
                            {r + 1}
                          </span>
                        </td>
                        {Array.from({ length: previewColCount }).map((_, c) => {
                          const cell = sheet.rows[r]?.[c];
                          const colSelected = isCols && config.selectedColumns.includes(c);
                          const cellSelected =
                            (colSelected && !(isHeader)) || (rowSelected);
                          const text = cell ? cellDisplay(cell) : '';
                          const truncated =
                            text.length > CELL_PREVIEW_CHARS
                              ? text.slice(0, CELL_PREVIEW_CHARS) + '…'
                              : text;
                          return (
                            <td
                              key={c}
                              className={cn(
                                'max-w-[160px] truncate border-b border-r border-ink-100 px-2 py-1 align-top text-[11px] text-ink-700',
                                cellSelected && 'bg-brand-50/70 text-brand-900'
                              )}
                              title={text}
                            >
                              {truncated || (
                                <span className="text-ink-300">·</span>
                              )}
                            </td>
                          );
                        })}
                        {hasMoreCols && (
                          <td className="border-b border-ink-100 px-2 py-1 text-center text-ink-400">
                            …
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {hasMoreRows && (
                    <tr>
                      <td
                        colSpan={previewColCount + (hasMoreCols ? 2 : 1)}
                        className="border-t border-ink-200 bg-ink-50/50 px-2 py-1.5 text-center text-[10px] text-ink-400"
                      >
                        … 还有 {sheet.rowCount - previewRowCount} 行未展示(翻译时全部处理)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-ink-400">
              非字符串单元格(数字 / 日期 / 公式 / 空)会自动跳过,不翻译。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-2xl border px-3 py-2.5 text-left transition',
        active
          ? 'border-brand-400 bg-brand-50/60 shadow-[0_2px_8px_rgba(52,199,89,0.18)]'
          : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/60'
      )}
    >
      <p
        className={cn(
          'text-sm font-semibold',
          active ? 'text-brand-700' : 'text-ink-900'
        )}
      >
        {label}
      </p>
      <p className="mt-0.5 text-[11px] leading-4 text-ink-500">{hint}</p>
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  small = false,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        small ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-brand-500' : 'bg-ink-300'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-out',
          small ? 'h-4 w-4' : 'h-5 w-5',
          checked ? (small ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'
        )}
      />
    </button>
  );
}
