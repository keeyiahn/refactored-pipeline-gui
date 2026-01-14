import * as git from 'isomorphic-git';

// Create a simple in-memory filesystem for git operations
class MemoryFS {
    constructor() {
        this.files = {};
        this.dirs = new Set(['/']);
    }

    async readFile(path) {
        const normalizedPath = this.normalizePath(path);
        if (this.files[normalizedPath]) {
            return new Uint8Array(this.files[normalizedPath]);
        }
        throw new Error(`File not found: ${path}`);
    }

    async writeFile(path, data) {
        const normalizedPath = this.normalizePath(path);
        this.files[normalizedPath] = typeof data === 'string' 
            ? new TextEncoder().encode(data) 
            : data;
        // Ensure parent directories exist
        const parts = normalizedPath.split('/').filter(Boolean);
        for (let i = 1; i < parts.length; i++) {
            this.dirs.add('/' + parts.slice(0, i).join('/'));
        }
    }

    async mkdir(path) {
        const normalizedPath = this.normalizePath(path);
        this.dirs.add(normalizedPath);
    }

    async readdir(path) {
        const normalizedPath = this.normalizePath(path);
        const prefix = normalizedPath === '/' ? '' : normalizedPath + '/';
        const entries = new Set();
        
        // Add directories
        for (const dir of this.dirs) {
            if (dir.startsWith(prefix) && dir !== normalizedPath) {
                const relative = dir.slice(prefix.length);
                const parts = relative.split('/').filter(Boolean);
                if (parts.length > 0) {
                    entries.add(parts[0] + '/');
                }
            }
        }
        
        // Add files
        for (const filePath of Object.keys(this.files)) {
            if (filePath.startsWith(prefix) && filePath !== normalizedPath) {
                const relative = filePath.slice(prefix.length);
                const parts = relative.split('/').filter(Boolean);
                if (parts.length > 0) {
                    entries.add(parts[0]);
                }
            }
        }
        
        return Array.from(entries);
    }

    async stat(path) {
        const normalizedPath = this.normalizePath(path);
        if (this.files[normalizedPath]) {
            return { type: 'file' };
        }
        if (this.dirs.has(normalizedPath)) {
            return { type: 'dir' };
        }
        throw new Error(`Path not found: ${path}`);
    }

    async rm(path) {
        const normalizedPath = this.normalizePath(path);
        delete this.files[normalizedPath];
    }

    async rmdir(path) {
        const normalizedPath = this.normalizePath(path);
        this.dirs.delete(normalizedPath);
    }

    normalizePath(path) {
        // Remove leading ./ and normalize slashes
        let normalized = path.replace(/^\.\//, '').replace(/\\/g, '/');
        // Ensure it starts with /
        if (!normalized.startsWith('/')) {
            normalized = '/' + normalized;
        }
        // Remove trailing slash for files
        if (normalized !== '/' && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }
        return normalized;
    }

    // Helper to sync repository structure to filesystem
    syncFromRepository(repository) {
        this.files = {};
        this.dirs = new Set(['/']);
        
        if (!repository) return;

        // Add pipeline.yaml
        if (repository.pipeline) {
            this.files['/pipeline.yaml'] = new TextEncoder().encode(repository.pipeline);
        }

        // Add requirements.txt
        this.files['/requirements.txt'] = new TextEncoder().encode('pynumaflow\n');

        // Add scripts
        Object.entries(repository.scripts || {}).forEach(([scriptName, scriptData]) => {
            const sanitizedName = scriptName.replace(/[^a-zA-Z0-9-_]/g, '_');
            const scriptContent = typeof scriptData === 'string' ? scriptData : (scriptData.data || scriptData);
            this.files[`/scripts/${sanitizedName}.py`] = new TextEncoder().encode(scriptContent);
        });

        // Add dockerfiles
        Object.entries(repository.scripts || {}).forEach(([scriptName]) => {
            const sanitizedName = scriptName.replace(/[^a-zA-Z0-9-_]/g, '_');
            const dockerfileContent = `FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN pip install -r requirements.txt
CMD ["python", "-u", "${sanitizedName}.py"]`;
            this.files[`/dockerfiles/${sanitizedName}/Dockerfile`] = new TextEncoder().encode(dockerfileContent);
        });

        // Add manifests if any
        Object.entries(repository.manifests || {}).forEach(([manifestName, manifestContent]) => {
            const content = typeof manifestContent === 'string' 
                ? manifestContent 
                : JSON.stringify(manifestContent);
            this.files[`/manifests/${manifestName}`] = new TextEncoder().encode(content);
        });
    }
}

// Initialize git repository
export async function initGitRepository(repository) {
    const fs = new MemoryFS();
    fs.syncFromRepository(repository);
    
    const dir = '/';
    
    try {
        await git.init({
            fs,
            dir,
            defaultBranch: 'main'
        });
        
        // Create initial commit
        await addAndCommit(fs, dir, 'Initial commit');
        
        return fs;
    } catch (error) {
        console.error('Error initializing git repository:', error);
        throw error;
    }
}

// Add all files and commit
export async function addAndCommit(fs, dir, message = 'Update repository') {
    try {
        // Get list of all files in the filesystem
        const getAllFiles = async (path = '/') => {
            const files = [];
            try {
                const entries = await fs.readdir(path);
                
                for (const entry of entries) {
                    // Remove trailing slash if present
                    const cleanEntry = entry.endsWith('/') ? entry.slice(0, -1) : entry;
                    const fullPath = path === '/' ? `/${cleanEntry}` : `${path}/${cleanEntry}`;
                    
                    try {
                        const stat = await fs.stat(fullPath);
                        if (stat.type === 'file') {
                            files.push(fullPath);
                        } else if (stat.type === 'dir') {
                            const subFiles = await getAllFiles(fullPath);
                            files.push(...subFiles);
                        }
                    } catch (e) {
                        // Skip if can't stat
                    }
                }
            } catch (e) {
                // Directory might not exist
            }
            
            return files;
        };

        // Add all files individually
        const allFiles = await getAllFiles();
        for (const file of allFiles) {
            try {
                // Remove leading / and use relative path
                const relativePath = file.startsWith('/') ? file.slice(1) : file;
                await git.add({
                    fs,
                    dir,
                    filepath: relativePath
                });
            } catch (error) {
                // File might already be added or not exist, continue
                console.warn(`Could not add file ${file}:`, error);
            }
        }

        // Check if there are changes to commit
        const status = await git.statusMatrix({ fs, dir });
        const hasChanges = status.some(([filepath, headStatus, workdirStatus, stageStatus]) => {
            return headStatus !== workdirStatus || workdirStatus !== stageStatus;
        });

        if (!hasChanges) {
            console.log('No changes to commit');
            return;
        }

        // Commit
        await git.commit({
            fs,
            dir,
            message,
            author: {
                name: 'Numaflow GUI',
                email: 'gui@numaflow.local'
            }
        });

        return true;
    } catch (error) {
        console.error('Error adding and committing:', error);
        throw error;
    }
}

// Update git repository with new repository state
export async function updateGitRepository(gitFS, repository, commitMessage = 'Update repository') {
    if (!gitFS) {
        // Initialize if not already initialized
        return await initGitRepository(repository);
    }

    // Sync filesystem with current repository state
    gitFS.syncFromRepository(repository);
    
    // Add and commit changes
    await addAndCommit(gitFS, '/', commitMessage);
    
    return gitFS;
}

