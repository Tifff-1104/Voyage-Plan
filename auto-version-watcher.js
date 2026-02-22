// 把这个文件放在你的项目根目录
// /your-project/auto-version-watcher.js

const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

class GitAutoVersion {
    constructor(repoPath) {
        this.repoPath = repoPath;
        this.pendingChanges = new Set();
        this.isProcessing = false;
        this.debounceTimer = null;
    }

    start() {
        console.log('开始监听文件变化...');
        
        // 监听所有文件变化
        const watcher = chokidar.watch('.', {
            ignored: /(^|[\/\\])\..|node_modules|\.git/,
            persistent: true,
            ignoreInitial: true,
            cwd: this.repoPath
        });

        watcher
            .on('add', path => this.onFileChange('add', path))
            .on('change', path => this.onFileChange('change', path))
            .on('unlink', path => this.onFileChange('delete', path));
    }

    onFileChange(event, filePath) {
        console.log(`检测到变更: ${event} - ${filePath}`);
        this.pendingChanges.add(filePath);
        
        // 防抖处理，避免频繁提交
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.processChanges(), 5000);
    }

    async processChanges() {
        if (this.isProcessing || this.pendingChanges.size === 0) return;
        
        this.isProcessing = true;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const versionBranch = `auto-version/${timestamp}`;
        
        try {
            // 执行git命令
            await this.execCommand(`cd ${this.repoPath}`);
            
            // 1. 保存当前分支
            const currentBranch = (await this.execCommand('git rev-parse --abbrev-ref HEAD')).trim();
            
            // 2. 创建新版本分支
            await this.execCommand(`git checkout -b ${versionBranch}`);
            
            // 3. 添加所有更改
            await this.execCommand('git add .');
            
            // 4. 提交更改
            const changes = Array.from(this.pendingChanges).join(', ');
            await this.execCommand(`git commit -m "自动版本: ${timestamp} - 更改文件: ${changes}"`);
            
            // 5. 推送到远程
            await this.execCommand(`git push origin ${versionBranch}`);
            
            // 6. 可选：创建标签
            await this.execCommand(`git tag ${versionBranch} -m "自动版本标签 ${timestamp}"`);
            await this.execCommand('git push --tags');
            
            // 7. 切回原分支
            await this.execCommand(`git checkout ${currentBranch}`);
            
            console.log(`✅ 已创建版本: ${versionBranch}`);
            
        } catch (error) {
            console.error('❌ 处理失败:', error);
        } finally {
            this.pendingChanges.clear();
            this.isProcessing = false;
        }
    }

    execCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd: this.repoPath }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }
}


// 使用前需要修改这个路径
const watcher = new GitAutoVersion('/Users/tiffany/Desktop/travel-planner/');  // 改成你的项目路径
watcher.start();