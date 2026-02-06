// module imports
import fs from "fs";

// file imports
import { PUBLIC_DIRECTORY } from "../configs/directories";

// destructuring assignments

class FilesRemover {
  private static instance: FilesRemover;

  constructor() {
    if (!FilesRemover.instance) {
      FilesRemover.instance = this;
    }
    return FilesRemover.instance;
  }

  /**
   * @description Delete files from server
   * @param {String[]} files array of files
   */
  async remove(files: string[]): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      const element = files[i];
      try {
        fs.unlinkSync(PUBLIC_DIRECTORY + element);
      } catch (error) {
        console.error(error);
      }
    }
  }
}

export default new FilesRemover();
// Object.freeze(new FilesRemover());
