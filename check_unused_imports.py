import os
import re

def strip_comments(text):
    # Strip multi-line comments
    text = re.sub(r'/\*[\s\S]*?\*/', '', text)
    # Strip single-line comments
    text = re.sub(r'//.*', '', text)
    return text

def parse_imports(content):
    # Match imports of forms:
    # 1. import defaultExport from "module-name";
    # 2. import * as name from "module-name";
    # 3. import { export1, export2 as alias2 } from "module-name";
    # 4. import defaultExport, { export1 } from "module-name";
    # 5. import "module-name"; (side effect import - no symbols)
    
    # We will find all lines starting with import and ending with a quote or semicolon
    # Let's match multiline import statements as well
    import_pattern = re.compile(r'import\s+([\s\S]*?)\s+from\s+[\'"][^\'"]+[\'"]', re.MULTILINE)
    
    symbols = []
    import_ranges = []
    
    for match in import_pattern.finditer(content):
        import_block = match.group(1).strip()
        start, end = match.span()
        import_ranges.append((start, end))
        
        # Parse the imported symbols from the block
        # e.g. "React, { useState, useEffect as ue }"
        # Let's handle curly braces
        curlies = re.search(r'\{([\s\S]*?)\}', import_block)
        
        # Default/star imports (part outside curlies)
        outside_curlies = import_block
        if curlies:
            # remove curlies from outside
            outside_curlies = import_block.replace(curlies.group(0), '')
            # parse inside curlies
            inside = curlies.group(1)
            # split by comma
            for parts in inside.split(','):
                parts = parts.strip()
                if not parts:
                    continue
                # handle "export1 as alias1" or "export1"
                if ' as ' in parts:
                    alias = parts.split(' as ')[1].strip()
                    symbols.append(alias)
                else:
                    symbols.append(parts.strip())
                    
        # now parse outside_curlies
        outside_curlies = outside_curlies.replace(',', ' ').strip()
        if outside_curlies:
            # Could be:
            # "React" or "* as React"
            for part in outside_curlies.split():
                part = part.strip()
                if not part or part == '*' or part == 'as':
                    continue
                symbols.append(part)
                
    return symbols, import_ranges

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        original_content = f.read()
        
    cleaned_content = strip_comments(original_content)
    symbols, import_ranges = parse_imports(cleaned_content)
    
    if not symbols:
        return []
        
    # Create content without the import statements to search for references
    content_without_imports = cleaned_content
    # To avoid changing indices, we can replace import ranges with spaces
    for start, end in sorted(import_ranges, reverse=True):
        content_without_imports = content_without_imports[:start] + ' ' * (end - start) + content_without_imports[end:]
        
    unused = []
    for symbol in symbols:
        # Match symbol as a whole word, not part of another identifier
        # Make sure it's not part of an object key or property access unless it's the start (e.g. obj.symbol is not symbol, but symbol.prop is)
        # So we can search for the symbol as a whole word
        pattern = re.compile(r'\b' + re.escape(symbol) + r'\b')
        matches = pattern.findall(content_without_imports)
        if len(matches) == 0:
            unused.append(symbol)
            
    return unused

def main():
    src_dir = 'netlify-app/src'
    all_unused = {}
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.js', '.jsx')):
                filepath = os.path.join(root, file)
                unused = check_file(filepath)
                if unused:
                    all_unused[filepath] = unused
                    
    if all_unused:
        print("FOUND UNUSED IMPORTS:")
        for file, symbols in all_unused.items():
            print(f"  {file}: {', '.join(symbols)}")
    else:
        print("No unused imports found!")

if __name__ == '__main__':
    main()
