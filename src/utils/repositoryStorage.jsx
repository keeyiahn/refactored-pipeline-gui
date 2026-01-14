// IndexedDB storage for repositories
const DB_NAME = 'numaflow-repositories';
const DB_VERSION = 1;
const STORE_NAME = 'repositories';

// Initialize IndexedDB
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'name' });
            }
        };
    });
}

// Save repository to IndexedDB
export async function saveRepository(repository) {
    try {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // Add lastModified timestamp
        const repoToSave = {
            ...repository,
            lastModified: new Date().toISOString()
        };
        
        await store.put(repoToSave);
        return true;
    } catch (error) {
        console.error('Error saving repository:', error);
        throw error;
    }
}

// Get all saved repositories (list)
export async function listRepositories() {
    try {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error listing repositories:', error);
        throw error;
    }
}

// Load repository by name
export async function loadRepository(name) {
    try {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        
        return new Promise((resolve, reject) => {
            const request = store.get(name);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error loading repository:', error);
        throw error;
    }
}

// Delete repository
export async function deleteRepository(name) {
    try {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        await store.delete(name);
        return true;
    } catch (error) {
        console.error('Error deleting repository:', error);
        throw error;
    }
}

