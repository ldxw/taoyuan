"""
字体子集化脚本
从项目源码中提取所有不重复字符，然后用 fonttools 生成仅含这些字符的子集字体。
在 CI 构建前运行，可将 zpix.ttf 从 ~323KB 大幅缩减。

依赖：pip install fonttools
"""

import os
import sys
import subprocess

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_PATH = os.path.join(PROJECT_DIR, 'src', 'assets', 'fonts', 'zpix.ttf')

# 要扫描的文件扩展名
EXTENSIONS = {'.ts', '.vue', '.html', '.json', '.js', '.tsx', '.jsx'}

# 要跳过的目录
SKIP_DIRS = {'node_modules', 'dist', 'docs', '.git', '.vscode', '.nuxt', '.output', 'public', 'scripts'}

# 基础安全字符集（确保这些字符始终保留）
BASE_CHARS = (
    # ASCII 可见字符
    ' !"#$%&\'()*+,-./0123456789:;<=>?@'
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`'
    'abcdefghijklmnopqrstuvwxyz{|}~'
    # 中文标点
    '，。、；：？！""''（）【】《》—…·'
    # 常用数学/特殊符号
    '×÷±≤≥≠→←↑↓'
)


def collect_chars() -> set[str]:
    """遍历项目源码，收集所有出现过的字符"""
    chars = set(BASE_CHARS)
    src_dir = os.path.join(PROJECT_DIR, 'src')

    for root, dirs, files in os.walk(src_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext not in EXTENSIONS:
                continue
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as fh:
                    chars.update(fh.read())
            except (UnicodeDecodeError, PermissionError):
                pass

    # 也扫描 index.html
    index_path = os.path.join(PROJECT_DIR, 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'r', encoding='utf-8') as fh:
            chars.update(fh.read())

    # 去掉控制字符
    for c in '\n\r\t\x00':
        chars.discard(c)

    return chars


def subset_font(chars: set[str]) -> None:
    """使用 pyftsubset 生成子集字体（原地替换 TTF）"""
    if not os.path.exists(FONT_PATH):
        print(f'错误：找不到字体文件 {FONT_PATH}', file=sys.stderr)
        sys.exit(1)

    original_size = os.path.getsize(FONT_PATH)

    # 构建文本字符串
    text = ''.join(sorted(chars, key=ord))

    # 生成子集 TTF（原地替换）
    cmd = [
        sys.executable, '-m', 'fontTools.subset',
        FONT_PATH,
        f'--text={text}',
        f'--output-file={FONT_PATH}',
        '--no-hinting',
        '--desubroutinize',
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f'pyftsubset 失败:\n{result.stderr}', file=sys.stderr)
        sys.exit(1)

    subset_size = os.path.getsize(FONT_PATH)

    print(f'字符数: {len(chars)}')
    print(f'原始: {original_size:,} bytes')
    print(f'子集: {subset_size:,} bytes ({subset_size * 100 // original_size}%)')
    print(f'节省: {(1 - subset_size / original_size) * 100:.1f}%')


def main() -> None:
    print('=== 字体子集化 ===')
    chars = collect_chars()
    subset_font(chars)
    print('=== 完成 ===')


if __name__ == '__main__':
    main()
