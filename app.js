const API_BASE = 'https://notebook-backend-xh7d.onrender.com/api';

let folders = [];
let currentFolder = null;
let notes = [];
let currentNote = null;
let editingFolderId = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadFolders();
});

// 加载文件夹
async function loadFolders() {
    try {
        const res = await fetch(`${API_BASE}/folders`);
        folders = await res.json();
        renderFolders();
    } catch (error) {
        console.error('加载文件夹失败:', error);
    }
}

// 渲染文件夹列表
function renderFolders() {
    const list = document.getElementById('folderList');
    list.innerHTML = folders.map(folder => `
        <div class="folder-item ${currentFolder && currentFolder._id === folder._id ? 'active' : ''}" 
             onclick="selectFolder('${folder._id}')" data-id="${folder._id}">
            <span class="folder-name">
                <span>📁</span>
                <span>${folder.name}</span>
            </span>
            <span class="note-count">${folder.noteCount || 0}</span>
            <div class="folder-actions">
                <button class="folder-action-btn" onclick="event.stopPropagation(); editFolder('${folder._id}', '${folder.name}')">✏️</button>
                <button class="folder-action-btn" onclick="event.stopPropagation(); deleteFolder('${folder._id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

// 选择文件夹
async function selectFolder(folderId) {
    currentFolder = folders.find(f => f._id === folderId);
    currentNote = null;
    renderFolders();
    
    document.getElementById('currentFolderName').textContent = currentFolder.name;
    document.getElementById('newNoteBtn').style.display = 'block';
    document.getElementById('notesList').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';
    
    await loadNotes(folderId);
}

// 加载笔记
async function loadNotes(folderId) {
    try {
        const res = await fetch(`${API_BASE}/folders/${folderId}/notes`);
        notes = await res.json();
        renderNotes();
    } catch (error) {
        console.error('加载笔记失败:', error);
    }
}

// 渲染笔记列表
function renderNotes() {
    const list = document.getElementById('notesListContent');
    if (notes.length === 0) {
        list.innerHTML = '<div style="padding: 20px; color: #999; text-align: center;">暂无笔记</div>';
        return;
    }
    list.innerHTML = notes.map(note => `
        <div class="note-item ${currentNote && currentNote._id === note._id ? 'active' : ''}" 
             onclick="selectNote('${note._id}')" data-id="${note._id}">
            <div class="note-item-title">${note.title || '无标题'}</div>
            <div class="note-item-preview">${note.content ? note.content.substring(0, 50) : '无内容'}</div>
            <div class="note-item-date">${new Date(note.updatedAt).toLocaleString('zh-CN')}</div>
        </div>
    `).join('');
}

// 选择笔记
function selectNote(noteId) {
    currentNote = notes.find(n => n._id === noteId);
    renderNotes();
    
    document.getElementById('noteEditor').style.display = 'flex';
    document.getElementById('noteTitle').value = currentNote.title || '';
    document.getElementById('noteContent').value = currentNote.content || '';
    document.getElementById('deleteNoteBtn').style.display = 'block';
}

// 创建新笔记
async function createNote() {
    if (!currentFolder) return;
    
    try {
        const res = await fetch(`${API_BASE}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: '新笔记',
                content: '',
                folderId: currentFolder._id
            })
        });
        const newNote = await res.json();
        notes.unshift(newNote);
        currentNote = newNote;
        renderNotes();
        
        document.getElementById('noteEditor').style.display = 'flex';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('deleteNoteBtn').style.display = 'block';
        document.getElementById('noteTitle').focus();
        
        loadFolders();
    } catch (error) {
        console.error('创建笔记失败:', error);
    }
}

// 保存笔记
async function saveNote() {
    if (!currentNote) return;
    
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    
    try {
        const res = await fetch(`${API_BASE}/notes/${currentNote._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });
        const updatedNote = await res.json();
        
        const index = notes.findIndex(n => n._id === currentNote._id);
        notes[index] = updatedNote;
        currentNote = updatedNote;
        renderNotes();
        
        alert('保存成功！');
    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败！');
    }
}

// 删除笔记
async function deleteNote() {
    if (!currentNote) return;
    if (!confirm('确定要删除这个笔记吗？')) return;
    
    try {
        await fetch(`${API_BASE}/notes/${currentNote._id}`, {
            method: 'DELETE'
        });
        
        notes = notes.filter(n => n._id !== currentNote._id);
        currentNote = null;
        renderNotes();
        
        document.getElementById('noteEditor').style.display = 'none';
        loadFolders();
    } catch (error) {
        console.error('删除失败:', error);
    }
}

// 显示新建文件夹弹窗
function showAddFolderModal() {
    editingFolderId = null;
    document.getElementById('folderModalTitle').textContent = '新建文件夹';
    document.getElementById('folderNameInput').value = '';
    document.getElementById('folderModal').classList.add('show');
}

// 编辑文件夹
function editFolder(folderId, folderName) {
    editingFolderId = folderId;
    document.getElementById('folderModalTitle').textContent = '编辑文件夹';
    document.getElementById('folderNameInput').value = folderName;
    document.getElementById('folderModal').classList.add('show');
}

// 关闭弹窗
function closeFolderModal() {
    document.getElementById('folderModal').classList.remove('show');
    editingFolderId = null;
}

// 保存文件夹
async function saveFolder() {
    const name = document.getElementById('folderNameInput').value.trim();
    if (!name) {
        alert('请输入文件夹名称');
        return;
    }
    
    try {
        if (editingFolderId) {
            await fetch(`${API_BASE}/folders/${editingFolderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
        } else {
            await fetch(`${API_BASE}/folders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
        }
        
        closeFolderModal();
        loadFolders();
    } catch (error) {
        console.error('保存文件夹失败:', error);
    }
}

// 删除文件夹
async function deleteFolder(folderId) {
    if (!confirm('确定要删除这个文件夹吗？文件夹内的所有笔记也会被删除！')) return;
    
    try {
        await fetch(`${API_BASE}/folders/${folderId}`, {
            method: 'DELETE'
        });
        
        if (currentFolder && currentFolder._id === folderId) {
            currentFolder = null;
            currentNote = null;
            document.getElementById('currentFolderName').textContent = '选择一个文件夹';
            document.getElementById('newNoteBtn').style.display = 'none';
            document.getElementById('notesList').style.display = 'none';
            document.getElementById('noteEditor').style.display = 'none';
            document.getElementById('emptyState').style.display = 'flex';
        }
        
        loadFolders();
    } catch (error) {
        console.error('删除文件夹失败:', error);
    }
}

// ===== 搜索功能 =====
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

function performSearch() {
    const keyword = document.getElementById('searchInput').value.trim();
    if (!keyword) {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }

    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<div style="padding:15px;color:#bdc3c7;">搜索中...</div>';

    fetch(`${API_BASE}/folders`)
        .then(res => res.json())
        .then(foldersData => {
            fetch(`${API_BASE}/notes`)
                .then(res => res.json())
                .then(allNotes => {
                    const results = allNotes.filter(note => 
                        note.title.toLowerCase().includes(keyword.toLowerCase()) ||
                        note.content.toLowerCase().includes(keyword.toLowerCase())
                    );

                    if (results.length === 0) {
                        resultsDiv.innerHTML = '<div style="padding:15px;color:#bdc3c7;">没有找到匹配的笔记</div>';
                        return;
                    }

                    resultsDiv.innerHTML = results.map(note => {
                        const folder = foldersData.find(f => f._id === note.folderId);
                        const folderName = folder ? folder.name : '未知文件夹';
                        
                        let preview = note.content.substring(0, 80);
                        if (note.content.length > 80) preview += '...';

                        const highlightRegex = new RegExp(`(${keyword})`, 'gi');
                        const highlightedTitle = note.title.replace(highlightRegex, '<span class="search-highlight">$1</span>');
                        const highlightedPreview = preview.replace(highlightRegex, '<span class="search-highlight">$1</span>');

                        return `
                            <div class="search-result-item" onclick="openSearchResult('${note.folderId}', '${note._id}')">
                                <div class="search-result-title">${highlightedTitle}</div>
                                <div class="search-result-folder">📁 ${folderName}</div>
                                <div class="search-result-preview">${highlightedPreview}</div>
                            </div>
                        `;
                    }).join('');
                })
                .catch(err => {
                    resultsDiv.innerHTML = '<div style="padding:15px;color:#e74c3c;">搜索失败</div>';
                });
        })
        .catch(err => {
            resultsDiv.innerHTML = '<div style="padding:15px;color:#e74c3c;">搜索失败</div>';
        });
}

function openSearchResult(folderId, noteId) {
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchInput').value = '';

    currentFolder = folders.find(f => f._id === folderId);
    
    if (currentFolder) {
        document.getElementById('currentFolderName').textContent = currentFolder.name;
        document.getElementById('newNoteBtn').style.display = 'block';
        document.getElementById('notesList').style.display = 'block';
        document.getElementById('emptyState').style.display = 'none';
    }

    renderFolders();

    loadNotes(folderId).then(() => {
        currentNote = notes.find(n => n._id === noteId);
        
        if (currentNote) {
            document.getElementById('noteTitle').value = currentNote.title;
            document.getElementById('noteContent').value = currentNote.content;
            document.getElementById('noteEditor').style.display = 'flex';
            document.getElementById('deleteNoteBtn').style.display = 'block';
            renderNotes();
        }
    });
}
