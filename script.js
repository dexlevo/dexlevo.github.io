function parseMarkdown(md) {
    let html = md;

    // Code blocks (```... ```)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Inline code (`... `)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers (### H3, ## H2, # H1)
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html. replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic (*text*)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Blockquotes (> text)
    html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');

    // Unordered lists (- item)
    html = html. replace(/^\- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    return html;
}

// ===== LOAD BLOG POSTS =====
async function loadBlogPosts() {
    const blogList = document.getElementById('blogList');
    
    try {
        // Fetch the list of blog files
        const response = await fetch('./blog/');
        const text = await response.text();
        
        // Parse directory listing
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const links = doc.querySelectorAll('a');
        
        const blogFiles = [];
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href.endsWith('.md') || href.endsWith('.txt'))) {
                blogFiles.push(href);
            }
        });

        if (blogFiles.length === 0) {
            blogList.innerHTML = '<p class="loading">No blog posts found.  Create markdown files in the /blog folder.</p>';
            return;
        }

        // Sort files by name (assuming date prefix like YYYY-MM-DD-title.md)
        blogFiles.sort(). reverse();

        blogList.innerHTML = '';

 
        for (const file of blogFiles) {
            try {
                const postResponse = await fetch(`./blog/${file}`);
                const postContent = await postResponse.text();
                
                
                const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
                const date = dateMatch ? dateMatch[1] : 'undated';
                
                
                const titleMatch = file.match(/\d{4}-\d{2}-\d{2}-(.+)\.(md|txt)$/);
                const title = titleMatch ? titleMatch[1]. replace(/-/g, ' ') : file;
                
                
                const htmlContent = parseMarkdown(postContent);
                
                
                const postElement = document.createElement('article');
                postElement.className = 'blog-post';
                postElement.innerHTML = `
                    <div class="blog-post-header">
                        <h2 class="blog-post-title">${escapeHtml(title)}</h2>
                        <span class="blog-post-date">${date}</span>
                    </div>
                    <div class="blog-post-content">
                        ${htmlContent}
                    </div>
                `;
                
                blogList.appendChild(postElement);
            } catch (error) {
                console.error(`Error loading blog post ${file}:`, error);
            }
        }
    } catch (error) {
        console.error('Error loading blog posts:', error);
        blogList.innerHTML = '<p class="loading">Error loading blog posts.  Make sure the /blog folder exists.</p>';
    }
}

// ===== LOAD MEDIA ARCHIVE =====
async function loadMediaArchive() {
    const mediaTypes = {
        video: {
            extensions: ['.mp4', '.webm', '.avi', '.mov'],
            id: 'videoList'
        },
        audio: {
            extensions: ['.mp3', '.wav', '.flac', '.ogg'],
            id: 'audioList'
        },
        image: {
            extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
            id: 'imageList'
        },
        executable: {
            extensions: ['. exe', '.sh', '.bin', '.app', '.jar'],
            id: 'executableList'
        }
    };

    for (const [type, config] of Object.entries(mediaTypes)) {
        await loadMediaCategory(type, config. extensions, config.id);
    }
}

async function loadMediaCategory(category, extensions, elementId) {
    const mediaList = document.getElementById(elementId);
    
    try {

        const response = await fetch(`./media/${category}/`);
        const text = await response.text();
        

        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const links = doc. querySelectorAll('a');
        
        const files = [];
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && ! href.startsWith('? ') && href !== '../') {
                const lowerHref = href.toLowerCase();
                if (extensions.some(ext => lowerHref.endsWith(ext))) {
                    files.push(href);
                }
            }
        });

        if (files. length === 0) {
            mediaList.innerHTML = '<p class="loading">No files found. </p>';
            return;
        }


        files.sort();

        mediaList.innerHTML = '';


        files.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = 'media-item';
            fileElement.innerHTML = `
                <a href="./media/${category}/${file}" title="${file}">
                    ${escapeHtml(file)}
                </a>
            `;
            mediaList.appendChild(fileElement);
        });
    } catch (error) {
        console.error(`Error loading ${category} files:`, error);
        mediaList.innerHTML = `<p class="loading">Error loading ${category} files. Make sure the /media/${category} folder exists.</p>`;
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}