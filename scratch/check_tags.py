import re

def trace_simple(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Strip comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    
    # regex for div and form tags specifically
    # Match <div, </div, <form, </form
    # Ignore self-closing <div ... /> (though rare/non-existent here)
    tags = re.finditer(r'<(div|form)|</(div|form)>', content)
    
    stack = []
    print(f"{'Line':<6} {'Action':<10} {'Tag':<10} {'Depth':<8}")
    print("-" * 40)
    
    for match in tags:
        full_match = match.group(0)
        line = content[:match.start()].count('\n') + 1
        
        if full_match.startswith('</'):
            tag_name = match.group(2)
            if not stack:
                print(f"{line:<6} {'EXTRA!':<10} {tag_name:<10} 0")
                continue
            last_tag, start_line = stack.pop()
            if last_tag != tag_name:
                print(f"{line:<6} {'WRONG!':<10} {tag_name:<10} (Expected {last_tag} line {start_line})")
                stack.append((last_tag, start_line)) # try to keep going
            else:
                print(f"{line:<6} {'Close':<10} {tag_name:<10} {len(stack):<8}")
        else:
            # Check if self-closing (we'll look for the end of this tag)
            remainder = content[match.end():]
            end_match = re.search(r'>', remainder)
            if end_match:
                tag_content = remainder[:end_match.start()]
                if tag_content.strip().endswith('/'):
                    # self-closing, skip
                    continue
            
            tag_name = match.group(1)
            stack.append((tag_name, line))
            print(f"{line:<6} {'Open':<10} {tag_name:<10} {len(stack):<8}")

    if stack:
        print("\nUnclosed tags:")
        for tag, line in stack:
            print(f"  <{tag}> at line {line}")

trace_simple(r'd:\Gado\test\Lomixa\src\pages\shared\SettingsPage.tsx')
