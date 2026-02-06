// module imports
import fs from "fs";
import { v4 } from "uuid";
import mime from "mime";

// file imports
import { PUBLIC_DIRECTORY } from "../configs/directories";

class FilesUploader {
  private static instance: FilesUploader;

  constructor() {
    if (!FilesUploader.instance) {
      FilesUploader.instance = this;
    }
    return FilesUploader.instance;
  }

  /**
   * @description Upload file
   * @param {Object} file file object
   * @param {string} directory directory to save file
   * @returns {Object} file object
   */
  uploadFile(file: any) {
    const fileExtension = mime.extension(file.mimetype);
    file.filename = v4() + "." + fileExtension;
    file.path = PUBLIC_DIRECTORY + file.filename;
    fs.createWriteStream(file.path).write(file.buffer);
    return file;
  }

  /**
   * @description Upload files
   * @param {[object]} files array of file
   * @param {string} directory directory to save file
   * @returns {[Object]} array of file
   */
  uploadFiles(files: any[]) {
    files = files.map((file: any) => {
      const fileExtension = mime.extension(file.mimetype);
      file.filename = v4() + "." + fileExtension;
      file.path = PUBLIC_DIRECTORY + file.filename;
      fs.createWriteStream(file.path).write(file.buffer);
      return file;
    });
    return files;
  }
}

export default new FilesUploader();
// Object.freeze(new FilesUploader());
