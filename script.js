// Global variables
let allTemplates = [];
let filteredTemplates = [];

// Load code templates from JSON
fetch('templates.json')
  .then(res => res.json())
  .then(templates => {
    // Sort templates by category, then by title
    allTemplates = templates.sort((a, b) => {
      const categoryA = a.category || 'Miscellaneous';
      const categoryB = b.category || 'Miscellaneous';
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }
      return a.title.localeCompare(b.title);
    });
    filteredTemplates = [...allTemplates];
    buildTOC();
    renderTemplates();
    updateSearchStats();
  });

// Build Table of Contents
function buildTOC() {
  const tocList = document.getElementById('toc-list');
  tocList.innerHTML = '';
  
  // Group templates by category
  const categories = {};
  allTemplates.forEach((tmpl, idx) => {
    const category = tmpl.category || 'Miscellaneous';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({ template: tmpl, index: idx });
  });
  
  // Sort categories
  const sortedCategories = Object.keys(categories).sort();
  
  // Build TOC with category sections
  sortedCategories.forEach(category => {
    // Create category header
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'toc-category';
    categoryHeader.textContent = category;
    tocList.appendChild(categoryHeader);
    
    // Add templates in this category
    categories[category].forEach(({ template, index }) => {
      const tocItem = document.createElement('div');
      tocItem.className = 'toc-item';
      tocItem.textContent = template.title;
      tocItem.onclick = () => scrollToTemplate(index);
      tocList.appendChild(tocItem);
    });
  });
}

// Scroll to specific template
function scrollToTemplate(index) {
  const templateElement = document.querySelector(`[data-template-index="${index}"]`);
  if (templateElement) {
    templateElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Add a temporary highlight effect
    templateElement.style.borderColor = 'var(--primary-color)';
    templateElement.style.boxShadow = 'var(--shadow-lg)';
    setTimeout(() => {
      templateElement.style.borderColor = '';
      templateElement.style.boxShadow = '';
    }, 2000);
  }
}

// Search functionality
function searchTemplates(query) {
  if (!query.trim()) {
    filteredTemplates = [...allTemplates];
  } else {
    const searchTerm = query.toLowerCase();
    filteredTemplates = allTemplates.filter(tmpl => {
      // Search in title
      if (tmpl.title.toLowerCase().includes(searchTerm)) return true;
      
      // Search in description
      if (tmpl.description && tmpl.description.toLowerCase().includes(searchTerm)) return true;
      
      // Search in tags
      if (tmpl.tags && tmpl.tags.some(tag => tag.toLowerCase().includes(searchTerm))) return true;
      
      // Search in category
      if (tmpl.category && tmpl.category.toLowerCase().includes(searchTerm)) return true;
      
      return false;
    });
  }
  
  renderTemplates();
  updateSearchStats();
}

// Update search statistics
function updateSearchStats() {
  const searchStats = document.getElementById('search-stats');
  const searchInput = document.getElementById('search-input');
  const noResults = document.getElementById('no-results');
  
  if (searchInput.value.trim()) {
    searchStats.textContent = `Showing ${filteredTemplates.length} of ${allTemplates.length} templates`;
    searchStats.style.display = 'block';
  } else {
    searchStats.style.display = 'none';
  }
  
  // Show/hide no results message
  if (filteredTemplates.length === 0 && searchInput.value.trim()) {
    noResults.style.display = 'block';
  } else {
    noResults.style.display = 'none';
  }
}

// Clear search
function clearSearch() {
  document.getElementById('search-input').value = '';
  searchTemplates('');
}

// Function to recursively find all dependencies
function findAllDependencies(templateTitle, visited = new Set()) {
  // Prevent infinite loops
  if (visited.has(templateTitle)) {
    return [];
  }
  visited.add(templateTitle);
  
  // Find the template by title
  const template = allTemplates.find(t => t.title === templateTitle);
  if (!template || !template.dependencies) {
    return [];
  }
  
  let allDeps = [];
  
  // For each dependency, recursively find its dependencies
  template.dependencies.forEach(dep => {
    const subDeps = findAllDependencies(dep, new Set(visited));
    allDeps.push(...subDeps);
    if (!allDeps.some(d => d.title === dep)) {
      const depTemplate = allTemplates.find(t => t.title === dep);
      if (depTemplate) {
        allDeps.push(depTemplate);
      }
    }
  });
  
  return allDeps;
}

// Function to copy template with all its dependencies
async function copyWithDependencies(template) {
  const dependencies = findAllDependencies(template.title);
  
  let combinedCode = '';
  
  // Add dependencies first (in the order they appear)
  dependencies.forEach(dep => {
    combinedCode += `// ========== ${dep.title} ==========\n`;
    if (dep.description) {
      combinedCode += `// ${dep.description}\n`;
    }
    combinedCode += `${dep.code}\n\n`;
  });
  
  // Add the main template last
  combinedCode += `// ========== ${template.title} ==========\n`;
  if (template.description) {
    combinedCode += `// ${template.description}\n`;
  }
  combinedCode += `${template.code}\n`;
  
  return combinedCode;
}

// Render templates
function renderTemplates() {
  const root = document.getElementById('templates-root');
  root.innerHTML = '';
  
  filteredTemplates.forEach((tmpl, filteredIdx) => {
    // Find original index for TOC navigation
    const originalIdx = allTemplates.findIndex(t => t === tmpl);
    
    // Create template container
    const container = document.createElement('div');
    container.className = 'template-container';
    container.setAttribute('data-template-index', originalIdx);

    // Title with category and tags
    const label = document.createElement('div');
    label.className = 'template-label';
    
    let titleHTML = tmpl.title;
    if (tmpl.category) {
      titleHTML += ` <span style="font-size: 0.8em; color: var(--text-secondary); font-weight: 400;">[${tmpl.category}]</span>`;
    }
    label.innerHTML = titleHTML;
    container.appendChild(label);

    // Tags (if available)
    if (tmpl.tags && tmpl.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.style.marginBottom = '1rem';
      
      tmpl.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.style.cssText = `
          display: inline-block;
          background: var(--background-shaded);
          color: var(--text-secondary);
          padding: 0.25rem 0.5rem;
          margin: 0.25rem 0.25rem 0.25rem 0;
          border-radius: 4px;
          font-size: 0.75rem;
          border: 1px solid var(--border);
        `;
        tagSpan.textContent = tag;
        tagsContainer.appendChild(tagSpan);
      });
      
      container.appendChild(tagsContainer);
    }

    // Code block with buttons
    const codeContainer = document.createElement('div');
    codeContainer.className = 'code-container';

    // Button group
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';

    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'collapse-btn';
    collapseBtn.innerHTML = 'Show Code';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = 'Copy Code';

    const codeDiv = document.createElement('div');
    codeDiv.className = 'collapsible collapsed';

    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = tmpl.code;
    pre.appendChild(code);
    codeDiv.appendChild(pre);

    collapseBtn.onclick = () => {
      codeDiv.classList.toggle('collapsed');
      collapseBtn.innerHTML = codeDiv.classList.contains('collapsed') ? 'Show Code' : 'Hide Code';
    };

    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(tmpl.code);
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = 'Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 500);
      } catch (err) {
        copyBtn.innerHTML = 'Failed';
        setTimeout(() => {
          copyBtn.innerHTML = 'Copy Code';
        }, 500);
      }
    };

    buttonGroup.appendChild(collapseBtn);
    buttonGroup.appendChild(copyBtn);

    // Add "Copy with Dependencies" button only if template has dependencies
    if (tmpl.dependencies && tmpl.dependencies.length > 0) {
      const copyWithDepsBtn = document.createElement('button');
      copyWithDepsBtn.className = 'copy-with-deps-btn';
      copyWithDepsBtn.innerHTML = 'Copy with Dependencies';

      copyWithDepsBtn.onclick = async () => {
        try {
          const combinedCode = await copyWithDependencies(tmpl);
          await navigator.clipboard.writeText(combinedCode);
          const originalText = copyWithDepsBtn.innerHTML;
          copyWithDepsBtn.innerHTML = 'Copied!';
          setTimeout(() => {
            copyWithDepsBtn.innerHTML = originalText;
          }, 500);
        } catch (err) {
          copyWithDepsBtn.innerHTML = 'Failed';
          setTimeout(() => {
            copyWithDepsBtn.innerHTML = 'Copy with Dependencies';
          }, 500);
        }
      };

      buttonGroup.appendChild(copyWithDepsBtn);
    }
    codeContainer.appendChild(buttonGroup);
    codeContainer.appendChild(codeDiv);

    container.appendChild(codeContainer);

    // Description
    if (tmpl.description) {
      const desc = document.createElement('div');
      desc.className = 'description';
      desc.innerText = tmpl.description;
      container.appendChild(desc);
    }

    root.appendChild(container);
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const tocHeader = document.getElementById('toc-header');
  const tocContainer = document.querySelector('.toc-container');
  
  // Search input with debouncing
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchTemplates(e.target.value);
    }, 300);
  });
  
  // Clear button
  searchClear.addEventListener('click', clearSearch);
  
  // TOC toggle
  tocHeader.addEventListener('click', () => {
    tocContainer.classList.toggle('toc-collapsed');
    const toggle = document.getElementById('toc-toggle');
    toggle.textContent = tocContainer.classList.contains('toc-collapsed') 
      ? '(click to expand)' 
      : '(click to collapse)';
  });
});

const btn = document.getElementById("scroll-top-btn");

window.addEventListener('scroll', function() {
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    btn.classList.add('visible');
  } else {
    btn.classList.remove('visible');
  }
});

btn.onclick = function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};