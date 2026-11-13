import postcss, { type Rule } from 'postcss';

// Keep strings and selector whitespace intact while normalizing feature syntax.
function normalizeCondition(text: string): string {
  const parts = text.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/|[^"'/]+|./g) ?? [];
  return parts.map(part => {
    if (part.startsWith('"') || part.startsWith("'")) return part;
    if (part.startsWith('/*')) return ' ';
    return part.replace(/\s+/g, ' ')
      .replace(/\s*([():<>=,])\s*/g, '$1')
      .replace(/\((min|max)-([a-z-]+):/gi,
        (_, bound, feature) => `(${feature.toLowerCase()}${bound.toLowerCase() === 'min' ? '>=' : '<='}`);
  }).join('').trim();
}

function ruleKey(rule: Rule, selector: string): string | undefined {
  const context: string[] = [];
  let utilities = false;
  for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
    if (parent.type === 'atrule') {
      if (/keyframes$/i.test(parent.name)) return;
      if (parent.name === 'layer' && parent.params === 'utilities') utilities = true;
      context.unshift(`@${parent.name} ${normalizeCondition(parent.params)}`);
    } else if (parent.type === 'rule') {
      context.unshift(parent.selector);
    }
  }
  // Theme variables and ordinary app CSS must retain their cascade behavior.
  if (!utilities || !selector.startsWith('.')) return;
  return JSON.stringify([context, selector]);
}

/** Remove only utilities already supplied by the client in the same cascade context. */
export function filterClayTailwindCss(css: string, clientCss: string, appendCss = ''): string {
  const shipped = new Set<string>();
  postcss.parse(clientCss).walkRules((rule) => {
    if (!rule.nodes.some(node => node.type === 'decl')) return;
    for (const selector of rule.selectors) {
      const key = ruleKey(rule, selector);
      if (key) shipped.add(key);
    }
  });
  const appended = new Set<string>();
  postcss.parse(appendCss).walkRules((rule) => {
    for (const selector of rule.selectors) {
      const key = ruleKey(rule, selector);
      if (key) appended.add(key);
    }
  });
  const root = postcss.parse(css);
  root.walkRules((rule) => {
    const selectors = rule.selectors.filter((selector) => {
      const key = ruleKey(rule, selector);
      return !key || appended.has(key) || !shipped.has(key);
    });
    if (selectors.length === rule.selectors.length) return;
    if (rule.nodes.some(node => node.type === 'rule' || node.type === 'atrule')) {
      // Keep nested app-only rules under all original parent selectors.
      const declarations = rule.nodes.filter(node => node.type === 'decl');
      if (selectors.length && declarations.length) {
        rule.cloneBefore({ selector: selectors.join(', '), nodes: declarations.map(node => node.clone()) });
      }
      declarations.forEach(node => node.remove());
    } else if (selectors.length) rule.selectors = selectors;
    else rule.remove();
  });
  return root.toString();
}
