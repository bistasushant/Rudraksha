import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function saveFileLocally(file: File, directory: string, fileName: string): Promise<string> {
    try {
        // Convert File to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', directory);
        await mkdir(uploadDir, { recursive: true });

        // Save file
        const filePath = join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        // Return the public URL path
        return `/${directory}/${fileName}`;
    } catch (error) {
        console.error('Error saving file:', error);
        throw new Error('Failed to save file');
    }
}
