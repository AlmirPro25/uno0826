
import { WebContainer } from '@webcontainer/api';
import { filesToWebContainerTree } from '../utils/fileSystem';
import { VirtualFile } from '../types';

let webContainerInstance: WebContainer | null = null;

export class WebContainerService {
    
    static async boot() {
        if (webContainerInstance) {
            return webContainerInstance;
        }

        // 1. Secure Context Check (Required for Service Workers & WebContainer)
        if (!window.isSecureContext) {
             throw new Error("ERR_NOT_SECURE_CONTEXT");
        }

        // 2. Cross-Origin Isolation Check (Required for SharedArrayBuffer)
        if (!window.crossOriginIsolated) {
            // Throw a specific code so the UI can display a helpful diagnostic message
            throw new Error("ERR_SHARED_ARRAY_BUFFER_MISSING");
        }

        try {
            webContainerInstance = await WebContainer.boot();
            return webContainerInstance;
        } catch (error: any) {
            if (error.message && error.message.includes('Cross-Origin-Opener-Policy')) {
                 throw new Error("ERR_COOP_COEP_MISSING");
            }
            throw new Error(`Failed to boot WebContainer: ${error.message}`);
        }
    }

    static getInstance() {
        return webContainerInstance;
    }

    static async mount(files: VirtualFile[]) {
        if (!webContainerInstance) {
             throw new Error("Runtime not initialized. Call WebContainerService.boot() first.");
        }
        try {
            const tree = filesToWebContainerTree(files);
            await webContainerInstance.mount(tree);
        } catch (error: any) {
            throw new Error(`Failed to mount file system: ${error.message}`);
        }
    }

    /**
     * Recursively writes files to the container without wiping the entire filesystem.
     * This is crucial for preserving node_modules during AI updates.
     */
    static async writeFiles(files: VirtualFile[]) {
        if (!webContainerInstance) return;

        const processNode = async (node: VirtualFile) => {
            if (node.isFolder) {
                // Ensure folder exists
                try {
                    await webContainerInstance?.fs.mkdir(node.path, { recursive: true });
                } catch (e) { 
                    // Ignore if already exists
                }
                
                if (node.children) {
                    for (const child of node.children) {
                        await processNode(child);
                    }
                }
            } else {
                await this.writeFile(node.path, node.content);
            }
        };

        for (const file of files) {
            await processNode(file);
        }
    }

    static async writeFile(filePath: string, content: string) {
        if (!webContainerInstance) return;
        try {
            // CRITICAL: Ensure directory exists before writing
            const parts = filePath.split('/');
            if (parts.length > 1) {
                const dir = parts.slice(0, -1).join('/');
                await webContainerInstance.fs.mkdir(dir, { recursive: true });
            }
            await webContainerInstance.fs.writeFile(filePath, content);
        } catch (error: any) {
            console.warn(`Failed to write file '${filePath}': ${error.message}`);
        }
    }

    static async readFile(filePath: string) {
        if (!webContainerInstance) throw new Error("Runtime not initialized.");
        try {
            const file = await webContainerInstance.fs.readFile(filePath, 'utf-8');
            return file;
        } catch (error: any) {
            throw new Error(`Failed to read file '${filePath}': ${error.message}`);
        }
    }

    static async deleteFile(filePath: string) {
        if (!webContainerInstance) return;
        try {
            await webContainerInstance.fs.rm(filePath, { recursive: true });
        } catch (error: any) {
            console.warn(`Failed to delete file '${filePath}': ${error.message}`);
        }
    }

    static async rename(oldPath: string, newPath: string) {
        if (!webContainerInstance) return;
        try {
            // Ensure parent directory exists
            const parts = newPath.split('/');
            if (parts.length > 1) {
                const dir = parts.slice(0, -1).join('/');
                try {
                    await webContainerInstance.fs.mkdir(dir, { recursive: true });
                } catch (e) { /* ignore */ }
            }
            await webContainerInstance.fs.rename(oldPath, newPath);
        } catch (error: any) {
            console.warn(`Failed to rename '${oldPath}' to '${newPath}': ${error.message}`);
        }
    }

    /**
     * Spawns an interactive shell (jsh) and pipes output to the provided callback.
     * Returns the process and a writer to send input (keystrokes) to the shell.
     */
    static async startShell(
        terminalCallback: (data: string) => void,
        cols: number = 80,
        rows: number = 24
    ) {
        if (!webContainerInstance) throw new Error("Runtime not initialized.");

        try {
            const process = await webContainerInstance.spawn('jsh', {
                terminal: { cols, rows },
                env: {
                    // Force color output for tools that detect non-TTY
                    FORCE_COLOR: '1',
                    npm_config_color: 'always',
                    TERMINAL: 'xterm-256color'
                }
            });
            
            process.output.pipeTo(new WritableStream({
                write(data) {
                    terminalCallback(data);
                }
            }));

            const inputWriter = process.input.getWriter();
            
            return { process, inputWriter };
        } catch (error: any) {
            throw new Error(`Failed to start shell: ${error.message}`);
        }
    }

    /**
     * Executes a command non-interactively and captures the output.
     */
    static async exec(cmd: string, args: string[], timeout: number = 60000) {
        if (!webContainerInstance) throw new Error("Runtime not initialized.");
        
        const process = await webContainerInstance.spawn(cmd, args, {
            env: {
                FORCE_COLOR: '1',
                npm_config_color: 'always',
                CI: 'true' // Helps some tools behave better
            }
        });
        let output = '';
        
        process.output.pipeTo(new WritableStream({
            write(data) {
                output += data;
            }
        }));

        // Add timeout to prevent hanging
        const exitPromise = process.exit;
        const timeoutPromise = new Promise<number>((_, reject) => 
            setTimeout(() => reject(new Error('Command timed out')), timeout)
        );

        try {
            const exitCode = await Promise.race([exitPromise, timeoutPromise]);
            return { output, exitCode: exitCode as number };
        } catch (e: any) {
            process.kill();
            return { output: output + `\n[TIMEOUT: Command exceeded ${timeout/1000}s]`, exitCode: 124 };
        }
    }

    /**
     * List directory contents
     */
    static async listDir(path: string = '.'): Promise<string[]> {
        if (!webContainerInstance) throw new Error("Runtime not initialized.");
        try {
            const entries = await webContainerInstance.fs.readdir(path, { withFileTypes: true });
            return entries.map(e => e.isDirectory() ? `${e.name}/` : e.name);
        } catch (e) {
            return [];
        }
    }

    /**
     * Check if a path exists
     */
    static async exists(path: string): Promise<boolean> {
        if (!webContainerInstance) return false;
        try {
            await webContainerInstance.fs.readFile(path);
            return true;
        } catch {
            try {
                await webContainerInstance.fs.readdir(path);
                return true;
            } catch {
                return false;
            }
        }
    }

    /**
     * Get file/folder stats
     */
    static async stat(path: string): Promise<{ isFile: boolean; isDirectory: boolean; size?: number } | null> {
        if (!webContainerInstance) return null;
        try {
            const content = await webContainerInstance.fs.readFile(path, 'utf-8');
            return { isFile: true, isDirectory: false, size: content.length };
        } catch {
            try {
                await webContainerInstance.fs.readdir(path);
                return { isFile: false, isDirectory: true };
            } catch {
                return null;
            }
        }
    }

    /**
     * Spawn a background process (like dev server) and return control
     */
    static async spawnBackground(
        cmd: string, 
        args: string[],
        onOutput?: (data: string) => void
    ): Promise<{ kill: () => void }> {
        if (!webContainerInstance) throw new Error("Runtime not initialized.");
        
        const process = await webContainerInstance.spawn(cmd, args, {
            env: {
                FORCE_COLOR: '1',
                npm_config_color: 'always'
            }
        });

        if (onOutput) {
            process.output.pipeTo(new WritableStream({
                write(data) {
                    onOutput(data);
                }
            }));
        }

        return {
            kill: () => process.kill()
        };
    }
}
