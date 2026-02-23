#!/usr/bin/env python3
"""
Fix dollar-quote conflicts in 026* migration files.

The problem: DO $$ blocks and $$ value string delimiters conflict.
Fix:
  - DO block uses $outer$...$outer$  (unique per file)
  - Each $$ VALUE string pair gets a unique sequential tag: $n1$...$n1$, $n2$...$n2$ etc.

PostgreSQL dollar-quoting with DIFFERENT tags can be nested safely:
  $n3$ content with $n7$...text...$n7$ more content $n3$
  ↑ outer string, scans for $n3$ only — $n7$ is just literal text inside it.
"""

import os
import re

BASE = '/Users/anweshrath/Documents/Cursor/Neeva Pilot/Oraya Saas/supabase/migrations/'

FILES = [
    '026_seed_agent_content.sql',
    '026b_seed_muse_vigil.sql',
    '026c_seed_koda_wraith.sql',
    '026d_seed_noor_forge.sql',
    '026e_seed_lark_coen.sql',
]

for fname in FILES:
    path = os.path.join(BASE, fname)

    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_count = content.count('$$')

    # Step 0: Neutralise $$ that appear inside SQL line comments (-- ...)
    # so they don't count as string delimiters.
    def neutralise_comment_dollars(text):
        lines = text.split('\n')
        out = []
        for line in lines:
            # Find the first '--' that is not inside a string
            comment_idx = line.find('--')
            if comment_idx != -1:
                line = line[:comment_idx] + line[comment_idx:].replace('$$', '$ $')
            out.append(line)
        return '\n'.join(out)

    content = neutralise_comment_dollars(content)

    # Step 1: Rename the DO block delimiters to $outer$
    # Replace only the first occurrence of "DO $$" and the last "END $$;"
    content = content.replace('DO $$\n', 'DO $outer$\n', 1)
    content = content.replace('\nEND $$;', '\nEND $outer$;', 1)

    # Step 2: Replace remaining $$ VALUE string pairs with unique sequential tags.
    # Each pair: first occurrence → $n1$, second occurrence (its closing pair) → $n1$
    # This guarantees each open/close pair has the same unique tag, and different pairs
    # have different tags — so PostgreSQL can parse them safely as nested strings.
    counter = 0
    while '$$' in content:
        counter += 1
        tag = f'$n{counter}$'

        # Replace the FIRST remaining $$ (opening delimiter)
        idx1 = content.index('$$')
        content = content[:idx1] + tag + content[idx1 + 2:]

        # Replace the NEXT remaining $$ (closing delimiter for this string)
        idx2 = content.index('$$', idx1)
        content = content[:idx2] + tag + content[idx2 + 2:]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

    remaining = content.count('$$')
    print(f'✅ {fname}: fixed {counter} string pairs, {original_count} $$ → {remaining} remaining')

print('\nDone. All files fixed.')
