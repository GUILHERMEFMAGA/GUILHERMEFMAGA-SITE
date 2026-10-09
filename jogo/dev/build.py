# junta os .js do index.html dentro do rua-vermelha.html (versão de um arquivo só)
import re, os
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..') + '/'
h = open(d + 'index.html', encoding='utf8').read()
def rep(m): return '<script>\n' + open(d + m.group(1), encoding='utf8').read().replace('</script>', '<\\/script>') + '\n</script>'
out = re.sub(r'<script src="([^"]+)"></script>', rep, h)
open(d + 'rua-vermelha.html', 'w', encoding='utf8').write(out); print(len(out))
