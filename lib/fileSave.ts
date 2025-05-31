import fs from "fs";
import path from "path";

export async function saveFileLocally(file: File, folder: string, fileName: string) {
    // Create folder path if not exists
    const uploadDir = path.join(process.cwd(), "public", folder);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create a writable stream for saving file
    const filePath = path.join(uploadDir, fileName);

    // Convert File to buffer and write
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);

    // Return the relative URL for accessing this file
    const publicUrl = `/${folder}/${fileName}`;
    return publicUrl;
}
