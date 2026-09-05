import os
import re

for root, _, files in os.walk("/Users/arshadaman/Cenvoras/frontend/cenvoras/src"):
    for file in files:
        if not file.endswith('.jsx') and not file.endswith('.tsx'):
            continue
        
        file_path = os.path.join(root, file)
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # Pattern: import {\nimport { getCurrencySymbol, formatCurrency } from '...';
        content = re.sub(r'import\s*\{\s*\nimport\s*\{\s*getCurrencySymbol', r'import { getCurrencySymbol', content)
        
        # Pattern: import { getCurrencySymbol, formatCurrency } from '...';Something } from ...
        # e.g., import { getCurrencySymbol, formatCurrency } from '../../utils/currency';useQuery } from "@tanstack/react-query";
        def fix_inline_import(match):
            return f"{match.group(1)}\nimport {{{match.group(2)}"
            
        content = re.sub(r'(import \{ getCurrencySymbol.*?;\s*)([a-zA-Z0-9_]+ *\} *from)', fix_inline_import, content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {file_path}")

